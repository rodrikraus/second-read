-- Core data model.
--
-- A brand is the tenant. Every row that belongs to a brand carries brand_id,
-- and child rows point at their parent through (id, brand_id), so a review, a
-- flag or a criterion cannot reference a row from another brand even when
-- application code gets it wrong.

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  -- How the brand sounds and what it expects, shown beside every reply under review.
  voice       text not null,
  procedures  text not null,
  -- Share of replies that land in the daily random sample (see replies.sample_bucket).
  sample_rate numeric(4, 3) not null default 0.150 check (sample_rate > 0 and sample_rate <= 1),
  created_at  timestamptz not null default now()
);

-- Staff. Kept apart from auth.users so a specialist can exist, and own replies
-- imported from a helpdesk, before they ever sign in.
create table public.people (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name    text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

-- Who works on which brand, and as what. Leadership is per brand, not per
-- person: a lead's team is whoever writes for the brands they lead.
create table public.brand_memberships (
  brand_id   uuid not null references public.brands (id),
  person_id  uuid not null references public.people (id),
  role       text not null check (role in ('lead', 'specialist')),
  created_at timestamptz not null default now(),
  primary key (brand_id, person_id)
);

create index brand_memberships_person_idx on public.brand_memberships (person_id);

-- What a good reply means for one brand. A criterion is never edited once in
-- use: a changed standard is a new row and the old one gets retired_at, so a
-- flag recorded last quarter keeps meaning what it meant then.
create table public.criteria (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands (id),
  -- Shared across brands, so "accuracy problems everywhere" stays one query.
  category   text not null check (category in ('accuracy', 'procedure', 'relevance', 'resolution', 'tone', 'speed')),
  label      text not null,
  guidance   text not null default '',
  -- critical: tells the customer something wrong, loses the account.
  -- major: the customer will have to write back. minor: off-voice, sloppy.
  severity   text not null check (severity in ('critical', 'major', 'minor')),
  position   smallint not null default 0,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, brand_id)
);

create index criteria_brand_idx on public.criteria (brand_id, position);

-- A reply that already went out, stored as a snapshot. Nothing edits it.
create table public.replies (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid not null references public.brands (id),
  specialist_id     uuid not null references public.people (id),
  -- Where the reply came from. A future helpdesk importer upserts on
  -- (brand_id, source, external_id) and never has to touch reviews.
  source            text not null,
  external_id       text not null,
  ticket_ref        text not null,
  subject           text not null,
  customer_name     text not null,
  customer_message  text not null,
  customer_wrote_at timestamptz not null,
  body              text not null,
  sent_at           timestamptz not null,
  -- 0 to 9999, derived from the id alone. A reply is in its brand's daily
  -- sample when sample_bucket < sample_rate * 10000: the sample cannot be
  -- re-drawn, and a reply imported late never pushes another one out.
  sample_bucket     smallint not null generated always as (
    (('x' || lpad(left(md5(id::text), 8), 16, '0'))::bit(64)::bigint % 10000)::smallint
  ) stored,
  created_at        timestamptz not null default now(),
  unique (brand_id, source, external_id),
  unique (id, brand_id),
  check (sent_at >= customer_wrote_at)
);

create index replies_brand_sent_idx on public.replies (brand_id, sent_at desc);
create index replies_specialist_sent_idx on public.replies (specialist_id, sent_at desc);

-- One lead's judgement of one reply.
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  reply_id    uuid not null,
  brand_id    uuid not null,
  reviewer_id uuid not null references public.people (id),
  -- 1 harmful, 2 poor, 3 acceptable, 4 good, 5 exemplary. The anchors sit next
  -- to the buttons in the UI so every lead scores against the same words.
  score       smallint not null check (score between 1 and 5),
  -- What the lead wrote to the specialist.
  note        text not null default '',
  -- 'sample' when the reply was in the daily sample, 'targeted' when the lead
  -- picked it by hand. Set by trigger, never by the client. Trends count
  -- samples only; a hand-picked reply is usually picked because it looked bad.
  selection   text not null check (selection in ('sample', 'targeted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (reply_id, brand_id) references public.replies (id, brand_id),
  unique (reply_id, reviewer_id),
  unique (id, brand_id)
);

create index reviews_brand_created_idx on public.reviews (brand_id, created_at desc);
create index reviews_reviewer_idx on public.reviews (reviewer_id);

-- A criterion the reply missed. Only misses are recorded: the lead clicks
-- what was wrong, not a checklist of everything that was right.
create table public.review_flags (
  review_id    uuid not null,
  criterion_id uuid not null,
  brand_id     uuid not null,
  primary key (review_id, criterion_id),
  foreign key (review_id, brand_id) references public.reviews (id, brand_id) on delete cascade,
  foreign key (criterion_id, brand_id) references public.criteria (id, brand_id)
);

create index review_flags_criterion_idx on public.review_flags (criterion_id);

-- Internal functions live in a schema the Data API does not expose.
create schema private;

-- Runs as the caller, so a reply hidden by row level security counts as
-- missing: the error is the same whether the reply exists or not.
create function private.set_review_selection() returns trigger
language plpgsql set search_path = '' as $$
begin
  select case when r.sample_bucket < b.sample_rate * 10000 then 'sample' else 'targeted' end
    into new.selection
    from public.replies r
    join public.brands b on b.id = r.brand_id
   where r.id = new.reply_id;
  if not found then
    raise exception 'reply % not found', new.reply_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger reviews_set_selection
  before insert on public.reviews
  for each row execute function private.set_review_selection();

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function private.touch_updated_at();
