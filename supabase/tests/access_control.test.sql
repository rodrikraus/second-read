-- Who can see what, checked as each role against the real policies.
-- Run with `npm run db:test`. Everything happens in a transaction that is
-- rolled back, so it never touches the seed data.
--
-- Cast: Lead A leads brand A, Lead B leads brand B. Spec writes for both
-- brands, Spec Two only for brand A.

begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'lead-a@test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'lead-b@test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'spec@test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000d', 'spec2@test', 'authenticated', 'authenticated');

insert into public.people (id, auth_user_id, full_name, email) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Lead A', 'lead-a@test'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'Lead B', 'lead-b@test'),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c', 'Spec', 'spec@test'),
  ('10000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-00000000000d', 'Spec Two', 'spec2@test');

-- Brand A samples every reply, brand B almost none.
insert into public.brands (id, slug, name, voice, procedures, sample_rate) values
  ('20000000-0000-0000-0000-00000000000a', 'brand-a', 'Brand A', 'v', 'p', 1),
  ('20000000-0000-0000-0000-00000000000b', 'brand-b', 'Brand B', 'v', 'p', 0.001);

insert into public.brand_memberships (brand_id, person_id, role) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'lead'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'lead'),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'specialist'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000c', 'specialist'),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000d', 'specialist');

insert into public.criteria (id, brand_id, category, label, severity) values
  ('30000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'accuracy', 'A accurate', 'critical'),
  ('30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000b', 'accuracy', 'B accurate', 'critical');

insert into public.replies (id, brand_id, specialist_id, source, external_id, ticket_ref, subject, customer_name, customer_message, customer_wrote_at, body, sent_at) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'test', 'a-1', 'T1', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000c', 'test', 'b-1', 'T2', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000d', 'test', 'a-2', 'T3', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour');

insert into public.reviews (reply_id, brand_id, reviewer_id, score) values
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 2),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 4);

select results_eq(
  $$ select rp.external_id, rv.selection from public.reviews rv join public.replies rp on rp.id = rv.reply_id order by 1 $$,
  $$ values ('a-2', 'sample'), ('b-1', 'targeted') $$,
  'selection comes from the brand sample rate, not from the client'
);

-- anon

set local role anon;

select throws_ok(
  $$ select * from public.replies $$,
  '42501', null,
  'anon cannot read replies at all'
);

reset role;

-- Spec, specialist on both brands

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

select results_eq(
  $$ select external_id from public.replies order by 1 $$,
  $$ values ('a-1'), ('b-1') $$,
  'a specialist sees their own replies on every brand, and nobody else''s'
);

select is(
  (select count(*) from public.reviews), 1::bigint,
  'a specialist sees the reviews of their replies only'
);

select results_eq(
  $$ select slug from public.brands order by 1 $$,
  $$ values ('brand-a'), ('brand-b') $$,
  'a specialist sees the brands they work on'
);

select results_eq(
  $$ select full_name from public.people order by 1 $$,
  $$ values ('Lead A'), ('Lead B'), ('Spec') $$,
  'a specialist sees themselves and their leads, not the other specialists'
);

select throws_ok(
  $$ insert into public.reviews (reply_id, brand_id, score) values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 5) $$,
  '42501', null,
  'a specialist cannot review, not even their own reply'
);

reset role;

-- Lead A, leads brand A only

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select results_eq(
  $$ select external_id from public.replies order by 1 $$,
  $$ values ('a-1'), ('a-2') $$,
  'a lead sees every reply on the brands they lead, and none elsewhere'
);

select results_eq(
  $$ select full_name from public.people order by 1 $$,
  $$ values ('Lead A'), ('Spec'), ('Spec Two') $$,
  'a lead sees the people on the brands they lead'
);

select lives_ok(
  $$ insert into public.reviews (reply_id, brand_id, score, note) values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 3, 'ok') $$,
  'a lead reviews a reply on their brand'
);

select results_eq(
  $$ select selection, reviewer_id = '10000000-0000-0000-0000-00000000000a' from public.reviews where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  $$ values ('sample', true) $$,
  'reviewer and selection are filled in by the database'
);

select throws_ok(
  $$ insert into public.reviews (reply_id, brand_id, score) values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000b', 1) $$,
  '23503', null,
  'a lead cannot review a reply on a brand they do not lead'
);

select throws_ok(
  $$ insert into public.reviews (reply_id, brand_id, score) values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000a', 1) $$,
  '23503', null,
  'claiming their own brand for another brand''s reply does not help'
);

select throws_ok(
  $$ insert into public.reviews (reply_id, brand_id, reviewer_id, score) values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', 1) $$,
  '42501', null,
  'the client cannot choose the reviewer'
);

select lives_ok(
  $$ insert into public.review_flags (review_id, criterion_id, brand_id)
     select id, '30000000-0000-0000-0000-00000000000a', brand_id from public.reviews where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  'a lead flags their review with one of the brand''s criteria'
);

select throws_ok(
  $$ insert into public.review_flags (review_id, criterion_id, brand_id)
     select id, '30000000-0000-0000-0000-00000000000b', brand_id from public.reviews where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  '23503', null,
  'a criterion from another brand cannot be attached'
);

select throws_ok(
  $$ update public.reviews set selection = 'sample' where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'selection cannot be rewritten after the fact'
);

select results_eq(
  $$ with changed as (update public.reviews set score = 1 where reply_id = '40000000-0000-0000-0000-000000000002' returning 1) select count(*) from changed $$,
  $$ values (0::bigint) $$,
  'another brand''s review cannot be edited, even with its id'
);

reset role;

-- Spec again: reads what Lead A wrote

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

select is(
  (select count(*) from public.reviews), 2::bigint,
  'the specialist now sees both reviews of their replies'
);

select is(
  (select count(*) from public.review_flags), 1::bigint,
  'and the flag attached to the new one'
);

reset role;

-- Spec Two, specialist on brand A only

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000d", "role": "authenticated"}';

select results_eq(
  $$ select external_id from public.replies order by 1 $$,
  $$ values ('a-2') $$,
  'a specialist does not see a colleague''s replies on a shared brand'
);

select is(
  (select count(*) from public.reviews), 1::bigint,
  'nor the reviews of those replies'
);

select is(
  (select count(*) from public.review_flags), 0::bigint,
  'nor their flags'
);

reset role;

select * from finish();
rollback;
