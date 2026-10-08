-- This bucket contains public marketing images only, never customer data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-images', 'business-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

-- Object path: <business UUID>/<filename>. Compare as text so malformed paths fail closed.
create function private.can_manage_business_image(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members m
    where m.user_id = (select auth.uid()) and m.role = 'owner'
      and m.business_id::text = split_part(object_name, '/', 1)
      and position('/' in object_name) > 0
  );
$$;
revoke all on function private.can_manage_business_image(text) from public, anon, authenticated;
grant execute on function private.can_manage_business_image(text) to authenticated;

create policy business_images_owner_read on storage.objects for select to authenticated
using (bucket_id = 'business-images' and private.can_manage_business_image(name));
create policy business_images_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'business-images' and private.can_manage_business_image(name));
create policy business_images_owner_update on storage.objects for update to authenticated
using (bucket_id = 'business-images' and private.can_manage_business_image(name))
with check (bucket_id = 'business-images' and private.can_manage_business_image(name));
create policy business_images_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'business-images' and private.can_manage_business_image(name));
