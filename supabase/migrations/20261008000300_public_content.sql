-- Public marketing content; no private business/account settings belong here.
alter table public.businesses
  add column story text not null default '',
  add column philosophy text not null default '',
  add column hero_image_path text,
  add column gallery_image_paths text[] not null default '{}',
  add column social_links jsonb not null default '{}' check (jsonb_typeof(social_links) = 'object');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_display_name text not null check (length(trim(customer_display_name)) between 1 and 120),
  quote text not null check (length(trim(quote)) between 1 and 1000),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index testimonials_business_idx on public.testimonials(business_id, sort_order);
create trigger set_updated_at before update on public.testimonials
for each row execute function private.set_updated_at();
alter table public.testimonials enable row level security;
revoke all on public.testimonials from anon, authenticated;
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
create policy testimonials_public_read on public.testimonials for select to anon, authenticated
using (is_published and exists (
  select 1 from public.businesses b where b.id = business_id and b.is_active
));
create policy testimonials_owner_manage on public.testimonials for all to authenticated
using (private.is_business_member(business_id, true))
with check (private.is_business_member(business_id, true));
comment on table public.testimonials is 'Publish only genuine reviews with permission to display the quote and name.';
