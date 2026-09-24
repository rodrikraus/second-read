-- The aggregate functions run as the caller, so an average can never be a
-- side door into rows the caller could not read one by one.
-- Lead A leads brand A, Lead B leads brand B; Spec and Spec Two write for A.

begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

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

insert into public.brands (id, slug, name, voice, procedures, sample_rate) values
  ('20000000-0000-0000-0000-00000000000a', 'brand-a', 'Brand A', 'v', 'p', 1),
  ('20000000-0000-0000-0000-00000000000b', 'brand-b', 'Brand B', 'v', 'p', 1);

insert into public.brand_memberships (brand_id, person_id, role) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'lead'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'lead'),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'specialist'),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000d', 'specialist');

insert into public.replies (id, brand_id, specialist_id, source, external_id, ticket_ref, subject, customer_name, customer_message, customer_wrote_at, body, sent_at) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c', 'test', 'a-1', 'T1', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000d', 'test', 'a-2', 'T2', 's', 'c', 'm', now() - interval '2 hours', 'b', now() - interval '1 hour');

insert into public.reviews (reply_id, brand_id, reviewer_id, score) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 2),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 4);

set local role anon;
select throws_ok(
  $$ select * from public.weekly_scores('20000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'anon cannot call the aggregates'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select results_eq(
  $$ select reviews, avg_score from public.weekly_scores('20000000-0000-0000-0000-00000000000a') $$,
  $$ values (2::bigint, 3.00::numeric) $$,
  'the lead gets the brand average over every specialist'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select results_eq(
  $$ select reviews, avg_score from public.weekly_scores('20000000-0000-0000-0000-00000000000a') $$,
  $$ values (1::bigint, 2.00::numeric) $$,
  'a specialist asking for the brand trend only gets their own reviews in it'
);
select results_eq(
  $$ select full_name from public.specialist_scores('20000000-0000-0000-0000-00000000000a') $$,
  $$ values ('Spec') $$,
  'a specialist cannot see a colleague''s average'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is_empty(
  $$ select * from public.weekly_scores('20000000-0000-0000-0000-00000000000a') $$,
  'a lead gets nothing for a brand they do not lead'
);
reset role;

select * from finish();
rollback;
