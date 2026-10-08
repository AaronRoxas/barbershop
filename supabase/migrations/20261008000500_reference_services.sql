-- Update only the local reference shop. Prices/durations are estimates for review.
-- Retain retired services and assignments so appointment history remains valid.
update public.services set is_active = false
where business_id = '10000000-0000-0000-0000-000000000001'
  and id = '20000000-0000-0000-0000-000000000002';

insert into public.services (id, business_id, name, description, price_minor, duration_minutes, sort_order, is_active)
select v.id::uuid, b.id, v.name, v.description, v.price_minor, v.duration_minutes, v.sort_order, true
from public.businesses b cross join (values
  ('20000000-0000-0000-0000-000000000001', 'Classic Haircut', 'A tailored cut, styled to suit you.', 25000, 30, 0),
  ('20000000-0000-0000-0000-000000000003', 'Beard Grooming', 'Shape, trim, and tidy your beard with a clean finish.', 20000, 30, 1),
  ('20000000-0000-0000-0000-000000000004', 'Colors and Treatment', 'Refresh your color and care for your hair. Discuss your desired result with your barber.', 120000, 120, 2),
  ('20000000-0000-0000-0000-000000000005', 'Kid’s Haircut', 'A patient, comfortable haircut for younger guests.', 20000, 30, 3),
  ('20000000-0000-0000-0000-000000000006', 'Haircut Consultation', 'Talk through styles, hair care, and your next cut with a barber.', 10000, 15, 4)
) v(id, name, description, price_minor, duration_minutes, sort_order)
where b.id = '10000000-0000-0000-0000-000000000001' and b.slug = 'reference'
on conflict (id) do update set name = excluded.name, description = excluded.description,
  price_minor = excluded.price_minor, duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order, is_active = excluded.is_active
where public.services.business_id = excluded.business_id;

insert into public.barber_services (business_id, barber_id, service_id)
select b.business_id, b.id, s.id from public.barbers b
join public.services s on s.business_id = b.business_id and s.is_active
where b.business_id = '10000000-0000-0000-0000-000000000001'
on conflict do nothing;
