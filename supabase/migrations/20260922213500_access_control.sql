-- Who can see what. Postgres enforces it, so the rule is the same for the
-- Next.js app, the REST API and any script holding a user's session.
--
--   * A lead sees everything in the brands they lead.
--   * A specialist sees their own replies and the reviews written on them,
--     and nobody else's, even on a brand they share.
--   * Nobody sees a brand they are not a member of.
--   * anon sees nothing.

-- Helpers. They are security definer so they can read people and
-- brand_memberships without running into those tables' own policies, which
-- call these same helpers. They only ever answer about the signed-in person.

create function private.current_person_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id from public.people p where p.auth_user_id = auth.uid()
$$;

create function private.led_brand_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.brand_id
    from public.brand_memberships m
   where m.person_id = private.current_person_id()
     and m.role = 'lead'
$$;

create function private.member_brand_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.brand_id
    from public.brand_memberships m
   where m.person_id = private.current_person_id()
$$;

create function private.own_reply_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.replies r where r.specialist_id = private.current_person_id()
$$;

-- Everyone on the brands you lead, plus the leads of the brands you work on.
-- A specialist can see who reviewed them, not the rest of the roster.
create function private.visible_person_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.person_id
    from public.brand_memberships m
   where m.brand_id in (select private.led_brand_ids())
  union
  select m.person_id
    from public.brand_memberships m
   where m.role = 'lead'
     and m.brand_id in (select private.member_brand_ids())
$$;

revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function
  private.current_person_id(),
  private.led_brand_ids(),
  private.member_brand_ids(),
  private.own_reply_ids(),
  private.visible_person_ids()
  to authenticated;

-- The reviewer is whoever is signed in; the client never sends it.
alter table public.reviews alter column reviewer_id set default private.current_person_id();

-- Row level security.

alter table public.brands            enable row level security;
alter table public.people            enable row level security;
alter table public.brand_memberships enable row level security;
alter table public.criteria          enable row level security;
alter table public.replies           enable row level security;
alter table public.reviews           enable row level security;
alter table public.review_flags      enable row level security;

create policy "members see their brands"
  on public.brands for select to authenticated
  using (id in (select private.member_brand_ids()));

create policy "see yourself and the people your brands connect you to"
  on public.people for select to authenticated
  using (
    id = (select private.current_person_id())
    or id in (select private.visible_person_ids())
  );

create policy "see your own memberships and the ones on brands you lead"
  on public.brand_memberships for select to authenticated
  using (
    person_id = (select private.current_person_id())
    or brand_id in (select private.led_brand_ids())
  );

create policy "members see their brands' criteria"
  on public.criteria for select to authenticated
  using (brand_id in (select private.member_brand_ids()));

create policy "leads see their brands' replies, specialists their own"
  on public.replies for select to authenticated
  using (
    brand_id in (select private.led_brand_ids())
    or specialist_id = (select private.current_person_id())
  );

create policy "leads see their brands' reviews, specialists the reviews of their replies"
  on public.reviews for select to authenticated
  using (
    brand_id in (select private.led_brand_ids())
    or reply_id in (select private.own_reply_ids())
  );

create policy "leads review replies on brands they lead"
  on public.reviews for insert to authenticated
  with check (
    brand_id in (select private.led_brand_ids())
    and reviewer_id = (select private.current_person_id())
  );

create policy "reviewers edit their own reviews while they still lead the brand"
  on public.reviews for update to authenticated
  using (reviewer_id = (select private.current_person_id()))
  with check (brand_id in (select private.led_brand_ids()));

-- Flags follow their review: the subquery runs under the reviews policy.
create policy "see the flags of reviews you can see"
  on public.review_flags for select to authenticated
  using (review_id in (select r.id from public.reviews r));

create policy "reviewers flag their own reviews"
  on public.review_flags for insert to authenticated
  with check (
    review_id in (select r.id from public.reviews r where r.reviewer_id = (select private.current_person_id()))
  );

create policy "reviewers unflag their own reviews"
  on public.review_flags for delete to authenticated
  using (
    review_id in (select r.id from public.reviews r where r.reviewer_id = (select private.current_person_id()))
  );

-- Grants. config.toml sets auto_expose_new_tables = false, so nothing is
-- reachable through the Data API unless it is granted here. The revoke makes
-- the same true on a hosted project, where the default is to expose.

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.brands,
  public.people,
  public.brand_memberships,
  public.criteria,
  public.replies
  to authenticated;

-- Column grants: the client cannot send reviewer_id or selection at all.
grant select on public.reviews to authenticated;
grant insert (reply_id, brand_id, score, note) on public.reviews to authenticated;
grant update (score, note) on public.reviews to authenticated;

grant select, insert, delete on public.review_flags to authenticated;
