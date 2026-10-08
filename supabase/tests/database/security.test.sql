begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Fixtures are rolled back; no dependency on seed data.
insert into auth.users (id) values
  ('a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000003');
insert into businesses (id, slug, name, is_active) values
  ('b0000000-0000-0000-0000-000000000001', 'test-one', 'One', true),
  ('b0000000-0000-0000-0000-000000000002', 'test-two', 'Two', true),
  ('b0000000-0000-0000-0000-000000000003', 'test-hidden', 'Hidden', false);
insert into business_members (business_id, user_id, role) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'staff');
insert into services (id, business_id, name, price_minor, duration_minutes, is_active) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Cut', 25000, 30, true),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Cut Two', 25000, 30, true),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Disabled', 25000, 30, false),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Hidden Cut', 25000, 30, true);
insert into barbers (id, business_id, name) values
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'One'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Two');
insert into barber_services (business_id, barber_id, service_id) values
  ('b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002');
insert into appointments (business_id, barber_id, service_id, starts_at, ends_at,
  customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency)
values
  ('b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   '2030-01-01 09:00+00', '2030-01-01 09:30+00', 'Customer', 'test@example.com', '09123456789', 'Cut', 25000, 30, 'PHP'),
  ('b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
   '2030-01-01 09:00+00', '2030-01-01 09:30+00', 'Private Two', 'private@example.com', '09123456789', 'Cut Two', 25000, 30, 'PHP');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint, 'All public tables enable RLS');
select throws_ok($$insert into businesses (slug, name, timezone) values ('bad-zone', 'Bad', 'Made/Up')$$,
  '23514', null, 'Unknown timezones are rejected');
select throws_ok($$insert into barber_services values ('b0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002')$$,
  '23503', null, 'Cross-tenant service assignments are rejected');

set local role anon;
select is((select count(*) from businesses where slug like 'test-%'), 2::bigint, 'Guests see active shops only');
select is((select count(*) from services where business_id::text like 'b000%'), 2::bigint, 'Guests see active services in active shops only');
select throws_ok('select * from appointments', '42501', null, 'Guests cannot read customer records');
select throws_ok('select * from business_members', '42501', null, 'Guests cannot read memberships');
select throws_ok('select * from time_off', '42501', null, 'Guests cannot read private time-off reasons');
select throws_ok($$insert into businesses (slug, name) values ('guest-shop', 'Guest')$$, '42501', null, 'Guest writes are denied');
select ok(not has_table_privilege('anon', 'public.appointments', 'insert'), 'Guests cannot insert bookings directly');
reset role;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select is((select count(*) from appointments), 1::bigint, 'Owner sees only their shop appointments');
select is((select count(*) from services where business_id = 'b0000000-0000-0000-0000-000000000001'), 2::bigint, 'Owner can read inactive services');
select lives_ok($$update services set price_minor = 26000 where id = 'c0000000-0000-0000-0000-000000000001'$$, 'Owner can edit own services');
with changed as (update services set price_minor = 1 where id = 'c0000000-0000-0000-0000-000000000002' returning id)
select is((select count(*) from changed), 0::bigint, 'Owner cannot edit another tenant');
select throws_ok($$update services set business_id = 'b0000000-0000-0000-0000-000000000002'
  where id = 'c0000000-0000-0000-0000-000000000003'$$, '42501', null, 'Owner cannot move rows to another tenant');
select throws_ok($$insert into business_members values ('b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001', 'owner')$$, '42501', null, 'Membership escalation is denied');
select ok(private.can_manage_business_image('b0000000-0000-0000-0000-000000000001/photo.webp'), 'Owner can upload to own path');
select ok(not private.can_manage_business_image('b0000000-0000-0000-0000-000000000002/photo.webp'), 'Owner cannot upload to another shop');
select ok(not private.can_manage_business_image('invalid/photo.webp'), 'Malformed storage path fails closed');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('business-images', 'b0000000-0000-0000-0000-000000000001/test.webp')$$, 'Owner image insert allowed');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('business-images', 'b0000000-0000-0000-0000-000000000002/test.webp')$$, '42501', null, 'Cross-tenant image insert denied');
select throws_ok($$update storage.objects set name = 'b0000000-0000-0000-0000-000000000002/moved.webp'
  where name = 'b0000000-0000-0000-0000-000000000001/test.webp'$$, '42501', null, 'Cross-tenant image move denied');
reset role;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select is((select count(*) from appointments), 1::bigint, 'Staff sees own shop appointments');
select lives_ok($$update appointments set customer_notes = 'Staff edit' where business_id = 'b0000000-0000-0000-0000-000000000001'$$, 'Staff can manage own appointments');
with changed as (update services set price_minor = 1 where business_id = 'b0000000-0000-0000-0000-000000000001' returning id)
select is((select count(*) from changed), 0::bigint, 'Staff cannot manage catalog');
select ok(not private.can_manage_business_image('b0000000-0000-0000-0000-000000000001/staff.webp'), 'Staff cannot upload marketing images');
select throws_ok('delete from appointments', '42501', null, 'Appointment history cannot be deleted through API');
reset role;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select is((select count(*) from appointments), 0::bigint, 'Unassigned authenticated users see no appointments');
select is((select count(*) from business_members), 0::bigint, 'Unassigned users see no memberships');
reset role;

-- Copying existing snapshots keeps constraint tests focused on the schedule boundary.
select throws_ok($$insert into appointments (business_id, barber_id, service_id, starts_at, ends_at,
  customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency)
  select business_id, barber_id, service_id, starts_at + interval '15 minutes', ends_at + interval '15 minutes',
    customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency
  from appointments where business_id = 'b0000000-0000-0000-0000-000000000001'$$,
  '23P01', null, 'Overlapping blocking appointments are rejected');
select lives_ok($$insert into appointments (business_id, barber_id, service_id, starts_at, ends_at,
  customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency)
  select business_id, barber_id, service_id, ends_at, ends_at + interval '30 minutes',
    customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency
  from appointments where business_id = 'b0000000-0000-0000-0000-000000000001'$$,
  'Back-to-back appointments are allowed');
update appointments set status = 'cancelled' where starts_at = '2030-01-01 09:00+00' and business_id = 'b0000000-0000-0000-0000-000000000001';
select lives_ok($$insert into appointments (business_id, barber_id, service_id, starts_at, ends_at,
  customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency)
  select business_id, barber_id, service_id, starts_at, ends_at,
    customer_name, customer_email, customer_phone, service_name, price_minor, duration_minutes, currency
  from appointments where status = 'cancelled'$$, 'Cancelled appointments release their slot');
select throws_ok($$update appointments set status = 'confirmed' where status = 'cancelled'$$,
  '23P01', null, 'Reconfirming an occupied cancelled appointment is rejected');
select throws_ok($$update appointments set ends_at = starts_at + interval '10 minutes'$$,
  '23514', null, 'Duration snapshots must match appointment bounds');
select throws_ok($$update appointments set barber_id = 'd0000000-0000-0000-0000-000000000002'
  where status = 'cancelled'$$, '23503', null, 'Cross-tenant appointment assignment is rejected');
select is((select count(*) from appointments where reference_code is null), 0::bigint, 'Every appointment gets a reference');
select is((select count(distinct reference_code) from appointments), (select count(*) from appointments), 'References are unique');
select is((select public from storage.buckets where id = 'business-images'), true, 'Marketing image bucket is public');
select * from finish();
rollback;
