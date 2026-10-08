-- All tenant-owned relationships include business_id: UUIDs alone are not a tenant boundary.
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create schema if not exists private;
revoke all on schema private from public;

create type public.member_role as enum ('owner', 'staff');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  timezone text not null default 'Asia/Manila',
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes between 5 and 120),
  minimum_notice_minutes integer not null default 60 check (minimum_notice_minutes >= 0),
  maximum_booking_days integer not null default 60 check (maximum_booking_days between 1 and 365),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_members_user_idx on public.business_members(user_id, business_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  price_minor integer not null check (price_minor >= 0),
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  biography text not null default '',
  specialty text not null default '',
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.barber_services (
  business_id uuid not null references public.businesses(id) on delete cascade,
  barber_id uuid not null,
  service_id uuid not null,
  primary key (business_id, barber_id, service_id),
  foreign key (business_id, barber_id) references public.barbers(business_id, id) on delete cascade,
  foreign key (business_id, service_id) references public.services(business_id, id) on delete cascade
);
create index barber_services_service_idx on public.barber_services(business_id, service_id);

-- ISO weekday: 1 = Monday, 7 = Sunday. Missing rows mean closed/unavailable.
-- Multiple intervals allow lunch breaks. Overnight hours must be split across days.
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null,
  check (opens_at < closes_at),
  unique (business_id, weekday, opens_at)
);

create table public.barber_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  barber_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null,
  check (opens_at < closes_at),
  unique (business_id, barber_id, weekday, opens_at),
  foreign key (business_id, barber_id) references public.barbers(business_id, id) on delete cascade
);

-- A date override replaces that date's weekly hours, for the shop or a specific barber.
-- A single opening interval per override; time_off can carve breaks out of it.
create table public.schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  barber_id uuid,
  date date not null,
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  check ((is_closed and opens_at is null and closes_at is null)
    or (not is_closed and opens_at is not null and closes_at is not null and opens_at < closes_at)),
  unique nulls not distinct (business_id, barber_id, date),
  foreign key (business_id, barber_id) references public.barbers(business_id, id) on delete cascade
);

-- Holidays, days off, and ad hoc breaks; NULL barber_id blocks the whole shop.
-- Reasons stay private. Availability is computed server-side in Phase 4.
create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  barber_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  check (starts_at < ends_at and isfinite(starts_at) and isfinite(ends_at)),
  foreign key (business_id, barber_id) references public.barbers(business_id, id) on delete cascade
);
create index time_off_business_start_idx on public.time_off(business_id, starts_at);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  barber_id uuid not null,
  service_id uuid not null,
  reference_code text not null unique default ('BRB-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  status public.appointment_status not null default 'pending',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  customer_name text not null check (length(trim(customer_name)) between 1 and 120),
  customer_email text not null check (length(customer_email) between 3 and 254),
  customer_phone text not null check (length(trim(customer_phone)) between 3 and 40),
  customer_notes text not null default '' check (length(customer_notes) <= 2000),
  -- Historical snapshots: changing a service must not rewrite an existing booking.
  service_name text not null check (length(trim(service_name)) between 1 and 120),
  price_minor integer not null check (price_minor >= 0),
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at and isfinite(starts_at) and isfinite(ends_at)),
  check (ends_at = starts_at + duration_minutes * interval '1 minute'),
  foreign key (business_id, barber_id, service_id)
    references public.barber_services(business_id, barber_id, service_id),
  -- Half-open ranges permit back-to-back appointments. Concurrent writes serialize here.
  exclude using gist (
    business_id with =, barber_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index appointments_business_start_idx on public.appointments(business_id, starts_at);
create index appointments_business_status_idx on public.appointments(business_id, status, starts_at);
create index appointments_assignment_idx on public.appointments(business_id, barber_id, service_id);

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.validate_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown business timezone' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_business_timezone before insert or update on public.businesses
for each row execute function private.validate_timezone();

do $$
declare table_name text;
begin
  foreach table_name in array array['businesses', 'services', 'barbers', 'appointments'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name);
  end loop;
end;
$$;

-- Keep definer functions outside exposed API schemas and lock their search paths.
-- Membership cannot be changed by API users, even owners: provision through trusted server/admin SQL.
create function private.is_business_member(target_business uuid, owner_only boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business and user_id = (select auth.uid())
      and (not owner_only or role = 'owner')
  );
$$;
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_business_member(uuid, boolean) to anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['businesses', 'business_members', 'services', 'barbers',
      'barber_services', 'business_hours', 'barber_hours', 'schedule_overrides', 'time_off', 'appointments'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end;
$$;

grant select on public.businesses, public.services, public.barbers, public.barber_services,
  public.business_hours, public.barber_hours, public.schedule_overrides to anon, authenticated;
grant update on public.businesses to authenticated;
grant select on public.business_members to authenticated;
grant select, insert, update, delete on public.services, public.barbers, public.barber_services,
  public.business_hours, public.barber_hours, public.schedule_overrides, public.time_off to authenticated;
grant select, insert, update on public.appointments to authenticated;

create policy businesses_read on public.businesses for select to anon, authenticated
using (is_active or private.is_business_member(id));
create policy businesses_update on public.businesses for update to authenticated
using (private.is_business_member(id, true)) with check (private.is_business_member(id, true));
create policy members_read on public.business_members for select to authenticated
using (private.is_business_member(business_id));

create policy services_read on public.services for select to anon, authenticated
using (private.is_business_member(business_id) or (is_active and exists (
  select 1 from public.businesses b where b.id = business_id and b.is_active)));
create policy barbers_read on public.barbers for select to anon, authenticated
using (private.is_business_member(business_id) or (is_active and exists (
  select 1 from public.businesses b where b.id = business_id and b.is_active)));
create policy assignments_read on public.barber_services for select to anon, authenticated
using (private.is_business_member(business_id) or (
  exists (select 1 from public.services s where s.id = service_id and s.business_id = barber_services.business_id and s.is_active)
  and exists (select 1 from public.barbers b where b.id = barber_id and b.business_id = barber_services.business_id and b.is_active)
));

do $$
declare table_name text;
begin
  foreach table_name in array array['business_hours', 'barber_hours', 'schedule_overrides'] loop
    execute format('create policy public_hours_read on public.%I for select to anon, authenticated using
      (private.is_business_member(business_id) or exists (select 1 from public.businesses b where b.id = business_id and b.is_active))', table_name);
  end loop;
  foreach table_name in array array['services', 'barbers', 'barber_services', 'business_hours', 'barber_hours', 'schedule_overrides', 'time_off'] loop
    execute format('create policy owner_manage on public.%I for all to authenticated using
      (private.is_business_member(business_id, true)) with check (private.is_business_member(business_id, true))', table_name);
  end loop;
end;
$$;
create policy time_off_staff_read on public.time_off for select to authenticated
using (private.is_business_member(business_id));
create policy appointments_read on public.appointments for select to authenticated
using (private.is_business_member(business_id));
create policy appointments_insert on public.appointments for insert to authenticated
with check (private.is_business_member(business_id));
create policy appointments_update on public.appointments for update to authenticated
using (private.is_business_member(business_id)) with check (private.is_business_member(business_id));

comment on table public.appointments is 'Private customer data. Guest writes use validated server code; never grant anon access.';
