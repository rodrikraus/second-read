-- save_review, the one way the app writes a review. Same cast as
-- access_control.test.sql: Lead A leads brand A, Spec writes for A and B.

begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'lead-a@test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'spec@test', 'authenticated', 'authenticated');

insert into public.people (id, auth_user_id, full_name, email) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Lead A', 'lead-a@test'),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c', 'Spec', 'spec@test');

insert into public.brands (id, slug, name, voice, procedures, sample_rate) values
  ('20000000-0000-0000-0000-00000000000a', 'brand-a', 'Brand A', 'v', 'p', 1),
  ('20000000-0000-0000-0000-00000000000b', 'brand-b', 'Brand B', 'v', 'p', 1);

insert into public.brand_memberships (brand_id, person_id, role) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'lead'),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'specialist'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000c', 'specialist');

insert into public.criteria (id, brand_id, category, label, severity) values
  ('30000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a', 'accuracy', 'A accurate', 'critical'),
  ('30000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-00000000000a', 'tone', 'A tone', 'minor'),
  ('30000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-00000000000b', 'accuracy', 'B accurate', 'critical');

insert into public.replies (id, brand_id, specialist_id, source, external_id, ticket_ref, subject, customer_name, customer_message, customer_wrote_at, body, sent_at) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'test', 'a-1', 'T1', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000c', 'test', 'b-1', 'T2', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour');

set local role anon;

select throws_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 5::smallint, '', '{}') $$,
  '42501', null,
  'anon cannot call save_review'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 2::smallint, 'check the facts',
       '{30000000-0000-0000-0000-0000000000a1,30000000-0000-0000-0000-0000000000a2}') $$,
  'a lead saves a review with two flags'
);

select results_eq(
  $$ select score, note, selection, (select count(*) from public.review_flags f where f.review_id = r.id)
       from public.reviews r where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  $$ values (2::smallint, 'check the facts', 'sample', 2::bigint) $$,
  'score, note, selection and flags are stored'
);

select results_eq(
  $$ select r.selection = case when public.in_sample(rp) then 'sample' else 'targeted' end
       from public.reviews r join public.replies rp on rp.id = r.reply_id $$,
  $$ values (true) $$,
  'the stored selection matches the in_sample computed column'
);

select lives_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 4::smallint, 'better on a second read',
       '{30000000-0000-0000-0000-0000000000a2}') $$,
  'saving again edits the same review'
);

select results_eq(
  $$ select r.score, count(*) over (), array(select f.criterion_id from public.review_flags f where f.review_id = r.id)
       from public.reviews r where reply_id = '40000000-0000-0000-0000-000000000001' $$,
  $$ values (4::smallint, 1::bigint, array['30000000-0000-0000-0000-0000000000a2'::uuid]) $$,
  'still one review, new score, flags replaced'
);

select throws_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 3::smallint, '',
       '{30000000-0000-0000-0000-0000000000b1}') $$,
  '23503', null,
  'a criterion from another brand is rejected'
);

select throws_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000002', 3::smallint, '', '{}') $$,
  '23503', null,
  'a reply on a brand the lead does not lead is not found'
);

-- Brand A retires the criterion that is still flagged on the review.
reset role;
update public.criteria set retired_at = now() where id = '30000000-0000-0000-0000-0000000000a2';
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 4::smallint, '',
       '{30000000-0000-0000-0000-0000000000a2}') $$,
  '23514', null,
  'a retired criterion cannot be flagged'
);

select lives_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 4::smallint, 'edited after a criterion was retired', '{}') $$,
  'a review can still be edited after one of its criteria is retired'
);

select results_eq(
  $$ select array(select f.criterion_id from public.review_flags f join public.reviews r on r.id = f.review_id
                   where r.reply_id = '40000000-0000-0000-0000-000000000001') $$,
  $$ values (array['30000000-0000-0000-0000-0000000000a2'::uuid]) $$,
  'the edit keeps the flag on the retired criterion'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

select throws_ok(
  $$ select public.save_review('40000000-0000-0000-0000-000000000001', 5::smallint, 'I like it', '{}') $$,
  '42501', null,
  'a specialist cannot review their own reply'
);

reset role;

select * from finish();
rollback;
