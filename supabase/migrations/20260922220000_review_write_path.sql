-- The review write path, and one definition of "in the sample".

-- Whether a reply is in its brand's daily sample. PostgREST exposes this as a
-- computed column (select=...,in_sample), and the selection trigger uses it
-- too, so the queue and the stored selection can never disagree. The
-- argument is unnamed ($1) because that is what makes the generated types
-- treat it as a column.
create function public.in_sample(public.replies) returns boolean
language sql stable set search_path = '' as $$
  select $1.sample_bucket < b.sample_rate * 10000
    from public.brands b
   where b.id = $1.brand_id
$$;

create or replace function private.set_review_selection() returns trigger
language plpgsql set search_path = '' as $$
begin
  select case when public.in_sample(r) then 'sample' else 'targeted' end
    into new.selection
    from public.replies r
   where r.id = new.reply_id;
  if not found then
    raise exception 'reply % not found', new.reply_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

-- Saves the signed-in lead's review of a reply, with its flags, in one
-- transaction: a second call edits the review and replaces the flags.
-- security invoker, so every policy and grant applies to the caller as if
-- they had written the statements themselves.
create function public.save_review(
  p_reply_id uuid,
  p_score smallint,
  p_note text,
  p_criterion_ids uuid[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_brand_id uuid;
  v_review_id uuid;
  v_criterion_ids uuid[] := coalesce(p_criterion_ids, '{}');
begin
  select r.brand_id into v_brand_id from public.replies r where r.id = p_reply_id;
  if not found then
    raise exception 'reply % not found', p_reply_id using errcode = 'foreign_key_violation';
  end if;

  insert into public.reviews (reply_id, brand_id, score, note)
  values (p_reply_id, v_brand_id, p_score, coalesce(p_note, ''))
  on conflict (reply_id, reviewer_id)
  do update set score = excluded.score, note = excluded.note
  returning id into v_review_id;

  delete from public.review_flags
   where review_id = v_review_id
     and criterion_id <> all (v_criterion_ids);

  insert into public.review_flags (review_id, criterion_id, brand_id)
  select v_review_id, c.id, v_brand_id
    from unnest(v_criterion_ids) as c(id)
  on conflict do nothing;

  return v_review_id;
end;
$$;

-- Functions are executable by PUBLIC unless revoked.
revoke execute on function public.in_sample(public.replies) from public, anon;
revoke execute on function public.save_review(uuid, smallint, text, uuid[]) from public, anon;
grant execute on function public.in_sample(public.replies) to authenticated;
grant execute on function public.save_review(uuid, smallint, text, uuid[]) to authenticated;
