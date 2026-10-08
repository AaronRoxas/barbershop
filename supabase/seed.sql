-- Local development fixtures only. No fake customer data or admin passwords.
insert into public.businesses (id, slug, name, description, timezone, currency, is_active)
values ('10000000-0000-0000-0000-000000000001', 'reference', 'Reference Barbershop',
  'Development shop. Replace this content before publishing.', 'Asia/Manila', 'PHP', true);

update public.businesses set
  story = 'Reference is a neighborhood kind of barbershop: a comfortable place to pause, talk through your style, and leave feeling refreshed. This is a sample shop, ready to be made your own.',
  philosophy = 'We believe a good haircut starts with listening. A thoughtful consultation, care in the details, and a finish that feels like you.'
where id = '10000000-0000-0000-0000-000000000001';

insert into public.services (id, business_id, name, description, price_minor, duration_minutes, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Classic Haircut', 'A tailored cut, styled to suit you.', 25000, 30, 0),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Beard Grooming', 'Shape, trim, and tidy your beard with a clean finish.', 20000, 30, 1),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Colors and Treatment', 'Refresh your color and care for your hair. Discuss your desired result with your barber.', 120000, 120, 2),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Kid’s Haircut', 'A patient, comfortable haircut for younger guests.', 20000, 30, 3),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Haircut Consultation', 'Talk through styles, hair care, and your next cut with a barber.', 10000, 15, 4);

insert into public.barbers (id, business_id, name, biography, specialty, sort_order)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Alex', 'Development barber profile.', 'Classic cuts', 0),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Sam', 'Development barber profile.', 'Fades', 1);

insert into public.barber_services (business_id, barber_id, service_id)
select b.business_id, b.id, s.id from public.barbers b
join public.services s on s.business_id = b.business_id;

insert into public.business_hours (business_id, weekday, opens_at, closes_at)
select '10000000-0000-0000-0000-000000000001', day, opening, closing
from generate_series(1, 6) day
cross join (values ('09:00'::time, '12:00'::time), ('13:00'::time, '19:00'::time)) hours(opening, closing);

insert into public.barber_hours (business_id, barber_id, weekday, opens_at, closes_at)
select b.business_id, b.id, h.weekday, h.opens_at, h.closes_at
from public.barbers b join public.business_hours h on h.business_id = b.business_id;
