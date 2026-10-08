-- Booking RPCs are callable only by validated server code. No customer rows are public.
alter table public.appointments add column request_id uuid;
create unique index appointments_request_idx on public.appointments(business_id, request_id);

create function public.booking_slots(p_business uuid, p_service uuid, p_barber uuid, p_date date)
returns table(barber_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable set search_path = '' as $$
  with config as (
    select b.*, s.duration_minutes from public.businesses b
    join public.services s on s.business_id = b.id and s.id = p_service and s.is_active
    where b.id = p_business and b.is_active
      and p_date between (now() at time zone b.timezone)::date
        and (now() at time zone b.timezone)::date + b.maximum_booking_days
  ), shop_hours as (
    select h.opens_at, h.closes_at from public.business_hours h
    where h.business_id = p_business and h.weekday = extract(isodow from p_date)
      and not exists (select 1 from public.schedule_overrides o where o.business_id = p_business and o.barber_id is null and o.date = p_date)
    union all
    select o.opens_at, o.closes_at from public.schedule_overrides o
    where o.business_id = p_business and o.barber_id is null and o.date = p_date and not o.is_closed
  ), staff_hours as (
    select h.barber_id, h.opens_at, h.closes_at from public.barber_hours h
    where h.business_id = p_business and h.weekday = extract(isodow from p_date)
      and not exists (select 1 from public.schedule_overrides o where o.business_id = p_business and o.barber_id = h.barber_id and o.date = p_date)
    union all
    select o.barber_id, o.opens_at, o.closes_at from public.schedule_overrides o
    where o.business_id = p_business and o.barber_id is not null and o.date = p_date and not o.is_closed
  ), candidates as (
    select distinct h.barber_id, c.timezone, c.duration_minutes,
      g.local_start, (g.local_start at time zone c.timezone) as start_instant,
      ((p_date + least(sh.closes_at, h.closes_at)) at time zone c.timezone) as close_instant
    from config c cross join shop_hours sh join staff_hours h on true
    join public.barbers b on b.id = h.barber_id and b.business_id = p_business and b.is_active
    join public.barber_services bs on bs.business_id = p_business and bs.barber_id = b.id and bs.service_id = p_service
    cross join lateral generate_series(p_date + sh.opens_at, p_date + sh.closes_at,
      c.slot_interval_minutes * interval '1 minute') g(local_start)
    where (p_barber is null or b.id = p_barber)
      and g.local_start >= p_date + h.opens_at
      and g.local_start + c.duration_minutes * interval '1 minute' <= p_date + least(sh.closes_at, h.closes_at)
      and (g.local_start at time zone c.timezone) >= now() + c.minimum_notice_minutes * interval '1 minute'
  )
  select c.barber_id, c.start_instant, c.start_instant + c.duration_minutes * interval '1 minute'
  from candidates c
  -- Reject nonexistent DST times and appointments which cross the closing instant.
  where c.start_instant at time zone c.timezone = c.local_start
    and c.start_instant + c.duration_minutes * interval '1 minute' <= c.close_instant
    and not exists (select 1 from public.time_off t where t.business_id = p_business
      and (t.barber_id is null or t.barber_id = c.barber_id)
      and t.starts_at < c.start_instant + c.duration_minutes * interval '1 minute' and t.ends_at > c.start_instant)
    and not exists (select 1 from public.appointments a where a.business_id = p_business and a.barber_id = c.barber_id
      and a.status in ('pending', 'confirmed')
      and a.starts_at < c.start_instant + c.duration_minutes * interval '1 minute' and a.ends_at > c.start_instant)
  order by 2, 1;
$$;

create function public.booking_availability(p_business uuid, p_service uuid, p_barber uuid, p_date date)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('date', d.day::date, 'barberId', s.barber_id,
    'startsAt', s.starts_at, 'endsAt', s.ends_at) order by s.starts_at, s.barber_id), '[]'::jsonb)
  from generate_series(p_date::timestamp, p_date::timestamp + interval '6 days', interval '1 day') d(day)
  cross join lateral public.booking_slots(p_business, p_service, p_barber, d.day::date) s;
$$;

create function public.create_guest_booking(p_business uuid, p_service uuid, p_barber uuid,
  p_starts_at timestamptz, p_request uuid, p_name text, p_email text, p_phone text, p_notes text)
returns text language plpgsql set search_path = '' as $$
declare
  b public.businesses;
  s public.services;
  previous public.appointments;
  slot record;
  reference text;
begin
  if p_request is null or p_starts_at is null or not isfinite(p_starts_at)
    or p_name is null or length(trim(p_name)) not between 1 and 120
    or p_email is null or length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_phone is null or length(trim(p_phone)) not between 3 and 40
    or p_notes is null or length(p_notes) > 2000 then
    raise exception 'Invalid customer details' using errcode = '22023';
  end if;
  -- Serialize retries of one request without serializing independent bookings.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_business::text || p_request::text, 0));
  select * into previous from public.appointments where business_id = p_business and request_id = p_request;
  if found then
    if previous.service_id = p_service and (p_barber is null or previous.barber_id = p_barber)
      and previous.starts_at = p_starts_at and previous.customer_name = trim(p_name)
      and previous.customer_email = p_email and previous.customer_phone = trim(p_phone) and previous.customer_notes = p_notes then
      return previous.reference_code;
    end if;
    raise exception 'Request already used' using errcode = '22023';
  end if;
  select * into b from public.businesses where id = p_business and is_active;
  select * into s from public.services where id = p_service and business_id = p_business and is_active;
  if b.id is null or s.id is null then
    raise exception 'Selection unavailable' using errcode = '22023';
  end if;
  for slot in select * from public.booking_slots(p_business, p_service, p_barber, (p_starts_at at time zone b.timezone)::date)
    where starts_at = p_starts_at loop
    begin
      insert into public.appointments(business_id, service_id, barber_id, starts_at, ends_at,
        customer_name, customer_email, customer_phone, customer_notes, service_name, price_minor,
        duration_minutes, currency, request_id)
      values (b.id, s.id, slot.barber_id, slot.starts_at, slot.ends_at, trim(p_name), p_email, trim(p_phone),
        p_notes, s.name, s.price_minor, s.duration_minutes, b.currency, p_request)
      returning reference_code into reference;
      return reference;
    exception when exclusion_violation then
      -- Any-barber bookings can try the next eligible chair after a race.
      null;
    end;
  end loop;
  raise exception 'Slot unavailable' using errcode = '23P01';
end;
$$;

revoke all on function public.booking_slots(uuid, uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.booking_availability(uuid, uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.create_guest_booking(uuid, uuid, uuid, timestamptz, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.booking_slots(uuid, uuid, uuid, date) to service_role;
grant execute on function public.booking_availability(uuid, uuid, uuid, date) to service_role;
grant execute on function public.create_guest_booking(uuid, uuid, uuid, timestamptz, uuid, text, text, text, text) to service_role;
