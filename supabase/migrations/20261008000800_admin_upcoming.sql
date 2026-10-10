-- Upcoming view uses the same occupancy/time filter as the dashboard count.
drop function public.list_admin_appointments(uuid, date, date, public.appointment_status, uuid, integer);
create function public.list_admin_appointments(p_business uuid, p_from date, p_to date,
  p_status public.appointment_status, p_barber uuid, p_page integer, p_upcoming boolean default false)
returns setof public.appointments language plpgsql stable security invoker set search_path = '' as $$
declare zone text;
begin
  if not private.is_business_member(p_business) then raise exception 'Membership required' using errcode = '42501'; end if;
  if p_page is null or p_page not between 0 and 10000 or (p_from is not null and p_to is not null and p_from > p_to) then
    raise exception 'Invalid filters' using errcode = '22023';
  end if;
  select timezone into zone from public.businesses where id = p_business;
  return query select * from public.appointments a where a.business_id = p_business
    and (p_from is null or a.starts_at >= p_from::timestamp at time zone zone)
    and (p_to is null or a.starts_at < (p_to + 1)::timestamp at time zone zone)
    and (p_status is null or a.status = p_status) and (p_barber is null or a.barber_id = p_barber)
    and (not coalesce(p_upcoming, false) or (a.starts_at >= now() and a.status in ('pending', 'confirmed')))
    order by a.starts_at, a.id limit 51 offset p_page * 50;
end;
$$;
revoke all on function public.list_admin_appointments(uuid, date, date, public.appointment_status, uuid, integer, boolean) from public, anon;
grant execute on function public.list_admin_appointments(uuid, date, date, public.appointment_status, uuid, integer, boolean) to authenticated;
