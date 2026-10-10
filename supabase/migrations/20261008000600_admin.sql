-- Shared availability preserves guest rules; rescheduling can exclude its own chair.
create function private.available_slots(p_business uuid, p_service uuid, p_barber uuid,
  p_date date, p_duration integer, p_exclude uuid)
returns table(barber_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable set search_path = '' as $$
  with config as (
    select b.*, p_duration as duration_minutes from public.businesses b
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
  where c.start_instant at time zone c.timezone = c.local_start
    and c.start_instant + c.duration_minutes * interval '1 minute' <= c.close_instant
    and not exists (select 1 from public.time_off t where t.business_id = p_business
      and (t.barber_id is null or t.barber_id = c.barber_id)
      and t.starts_at < c.start_instant + c.duration_minutes * interval '1 minute' and t.ends_at > c.start_instant)
    and not exists (select 1 from public.appointments a where a.business_id = p_business and a.barber_id = c.barber_id
      and a.id is distinct from p_exclude and a.status in ('pending', 'confirmed')
      and a.starts_at < c.start_instant + c.duration_minutes * interval '1 minute' and a.ends_at > c.start_instant)
  order by 2, 1;
$$;
revoke all on function private.available_slots(uuid, uuid, uuid, date, integer, uuid) from public, anon, authenticated;
grant execute on function private.available_slots(uuid, uuid, uuid, date, integer, uuid) to service_role;

create or replace function public.booking_slots(p_business uuid, p_service uuid, p_barber uuid, p_date date)
returns table(barber_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable set search_path = '' as $$
  select slot.* from public.services s
  cross join lateral private.available_slots(p_business, p_service, p_barber, p_date, s.duration_minutes, null) slot
  where s.business_id = p_business and s.id = p_service and s.is_active;
$$;

-- Authenticated writes must use the validated transaction, including direct API clients.
revoke insert, update on public.appointments from authenticated;
create function public.manage_admin_appointment(p_business uuid, p_id uuid, p_expected timestamptz,
  p_service uuid, p_barber uuid, p_local_start timestamp, p_status public.appointment_status,
  p_name text, p_email text, p_phone text, p_notes text, p_request uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  b public.businesses; s public.services; a public.appointments;
  start_instant timestamptz; finish_instant timestamptz; duration integer;
  changed_schedule boolean;
begin
  if not private.is_business_member(p_business) then
    raise exception 'Membership required' using errcode = '42501';
  end if;
  if p_status is null or p_local_start is null or not isfinite(p_local_start)
    or p_name is null or length(trim(p_name)) not between 1 and 120
    or p_email is null or length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_phone is null or length(trim(p_phone)) not between 3 and 40
    or p_phone !~ '^[+0-9() .-]+$' or p_notes is null or length(p_notes) > 2000 then
    raise exception 'Invalid appointment details' using errcode = '22023';
  end if;
  select * into b from public.businesses where id = p_business;
  start_instant := p_local_start at time zone b.timezone;
  if start_instant at time zone b.timezone <> p_local_start then
    raise exception 'Nonexistent local time' using errcode = '22023';
  end if;
  if p_id is null then
    if p_request is null or p_status not in ('pending', 'confirmed') then
      raise exception 'New appointments must be pending or confirmed' using errcode = '22023';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_business::text || p_request::text, 0));
    select * into a from public.appointments where business_id = p_business and request_id = p_request;
    if found then
      if a.service_id = p_service and a.barber_id = p_barber and a.starts_at = start_instant
        and a.customer_name = trim(p_name) and a.customer_email = p_email
        and a.customer_phone = trim(p_phone) and a.customer_notes = p_notes then return a.id; end if;
      raise exception 'Request already used' using errcode = '22023';
    end if;
  else
    select * into a from public.appointments where business_id = p_business and id = p_id for update;
    if not found then raise exception 'Appointment unavailable' using errcode = '42501'; end if;
    if p_expected is null or a.updated_at <> p_expected then
      raise exception 'Appointment changed; reload before saving' using errcode = '40001';
    end if;
    if a.status in ('completed', 'cancelled', 'no_show') and p_status <> a.status then
      raise exception 'Finished appointments cannot be reopened' using errcode = '22023';
    end if;
    if p_status in ('completed', 'no_show') and a.starts_at > now() then
      raise exception 'Appointment has not started yet' using errcode = '22023';
    end if;
  end if;
  changed_schedule := p_id is null or a.service_id is distinct from p_service
    or a.barber_id is distinct from p_barber or a.starts_at is distinct from start_instant;
  if changed_schedule and p_status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed appointments can be rescheduled' using errcode = '22023';
  end if;
  select * into s from public.services where business_id = p_business and id = p_service;
  duration := case when p_id is not null and a.service_id = p_service then a.duration_minutes else s.duration_minutes end;
  finish_instant := start_instant + duration * interval '1 minute';
  if changed_schedule and not exists (
    select 1 from private.available_slots(p_business, p_service, p_barber, p_local_start::date, duration, p_id) slot
    where slot.starts_at = start_instant and slot.barber_id = p_barber
  ) then raise exception 'Slot unavailable' using errcode = '23P01'; end if;
  if p_id is null then
    insert into public.appointments (business_id, service_id, barber_id, starts_at, ends_at, status,
      customer_name, customer_email, customer_phone, customer_notes, service_name, price_minor,
      duration_minutes, currency, request_id)
    values (p_business, s.id, p_barber, start_instant, finish_instant, p_status, trim(p_name), p_email,
      trim(p_phone), p_notes, s.name, s.price_minor, duration, b.currency, p_request)
    returning id into p_id;
  else
    update public.appointments set service_id = p_service, barber_id = p_barber, starts_at = start_instant,
      ends_at = finish_instant, status = p_status, customer_name = trim(p_name), customer_email = p_email,
      customer_phone = trim(p_phone), customer_notes = p_notes,
      service_name = case when a.service_id = p_service then a.service_name else s.name end,
      price_minor = case when a.service_id = p_service then a.price_minor else s.price_minor end,
      duration_minutes = duration, currency = case when a.service_id = p_service then a.currency else b.currency end
    where business_id = p_business and id = p_id;
  end if;
  return p_id;
end;
$$;

-- Replace assignment sets atomically; historical assignments cannot be removed.
create function public.set_barber_services(p_business uuid, p_barber uuid, p_services uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_business_member(p_business, true) then raise exception 'Owner required' using errcode = '42501'; end if;
  perform 1 from public.barbers where business_id = p_business and id = p_barber for update;
  if not found or p_services is null then raise exception 'Barber unavailable' using errcode = '22023'; end if;
  delete from public.barber_services where business_id = p_business and barber_id = p_barber and not (service_id = any(p_services));
  insert into public.barber_services (business_id, barber_id, service_id)
    select p_business, p_barber, unnest(p_services) on conflict do nothing;
end;
$$;

create function public.replace_weekly_hours(p_business uuid, p_barber uuid, p_intervals jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_business_member(p_business, true) then raise exception 'Owner required' using errcode = '42501'; end if;
  perform 1 from public.businesses where id = p_business for update;
  if p_intervals is null or jsonb_typeof(p_intervals) <> 'array' or jsonb_array_length(p_intervals) > 70 then
    raise exception 'Invalid hours' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_intervals) as h(weekday integer, opens_at time, closes_at time)
    where weekday is null or weekday not between 1 and 7 or opens_at is null or closes_at is null or opens_at >= closes_at)
    or exists (select 1 from jsonb_array_elements(p_intervals) with ordinality a(v, n)
      join jsonb_array_elements(p_intervals) with ordinality c(v, n) on a.n < c.n
      where a.v->>'weekday' = c.v->>'weekday' and (a.v->>'opens_at')::time < (c.v->>'closes_at')::time
        and (c.v->>'opens_at')::time < (a.v->>'closes_at')::time) then
    raise exception 'Hours overlap or are invalid' using errcode = '22023';
  end if;
  if p_barber is null then
    delete from public.business_hours where business_id = p_business;
    insert into public.business_hours (business_id, weekday, opens_at, closes_at)
      select p_business, weekday, opens_at, closes_at from jsonb_to_recordset(p_intervals) as h(weekday smallint, opens_at time, closes_at time);
  else
    if not exists (select 1 from public.barbers where business_id = p_business and id = p_barber) then
      raise exception 'Barber unavailable' using errcode = '22023';
    end if;
    delete from public.barber_hours where business_id = p_business and barber_id = p_barber;
    insert into public.barber_hours (business_id, barber_id, weekday, opens_at, closes_at)
      select p_business, p_barber, weekday, opens_at, closes_at from jsonb_to_recordset(p_intervals) as h(weekday smallint, opens_at time, closes_at time);
  end if;
end;
$$;

create function public.add_admin_time_off(p_business uuid, p_barber uuid, p_start timestamp, p_end timestamp, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare zone text; start_instant timestamptz; end_instant timestamptz;
begin
  if not private.is_business_member(p_business, true) then raise exception 'Owner required' using errcode = '42501'; end if;
  select timezone into zone from public.businesses where id = p_business;
  start_instant := p_start at time zone zone; end_instant := p_end at time zone zone;
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end)
    or start_instant >= end_instant or start_instant at time zone zone <> p_start or end_instant at time zone zone <> p_end
    or p_reason is null or length(p_reason) > 2000 then raise exception 'Invalid time off' using errcode = '22023'; end if;
  insert into public.time_off (business_id, barber_id, starts_at, ends_at, reason)
    values (p_business, p_barber, start_instant, end_instant, p_reason);
end;
$$;

revoke all on function public.manage_admin_appointment(uuid, uuid, timestamptz, uuid, uuid, timestamp, public.appointment_status, text, text, text, text, uuid) from public, anon;
revoke all on function public.set_barber_services(uuid, uuid, uuid[]) from public, anon;
revoke all on function public.replace_weekly_hours(uuid, uuid, jsonb) from public, anon;
revoke all on function public.add_admin_time_off(uuid, uuid, timestamp, timestamp, text) from public, anon;
grant execute on function public.manage_admin_appointment(uuid, uuid, timestamptz, uuid, uuid, timestamp, public.appointment_status, text, text, text, text, uuid) to authenticated;
grant execute on function public.set_barber_services(uuid, uuid, uuid[]) to authenticated;
grant execute on function public.replace_weekly_hours(uuid, uuid, jsonb) to authenticated;
grant execute on function public.add_admin_time_off(uuid, uuid, timestamp, timestamp, text) to authenticated;
