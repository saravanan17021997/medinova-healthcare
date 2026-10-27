-- =====================================================================
-- SaraDev Healthcare: image storage (step 3 of 4)
-- Creates the "sd-media" bucket for images uploaded from the admin panel.
--   * anyone can view the images (they appear on the public website)
--   * only admins can upload, replace or delete
--   * images only (JPEG, PNG, WebP, AVIF), max 5 MB each
--   * SVG is not allowed, because SVG files can carry scripts
-- Run AFTER 01_sd_schema.sql.
-- If a policy line fails with "must be owner of table objects", create the
-- same four policies in Dashboard -> Storage -> Policies instead.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sd-media', 'sd-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists sd_media_admin_read on storage.objects;
create policy sd_media_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'sd-media' and public.sd_is_admin());

drop policy if exists sd_media_admin_insert on storage.objects;
create policy sd_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sd-media' and public.sd_is_admin());

drop policy if exists sd_media_admin_update on storage.objects;
create policy sd_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'sd-media' and public.sd_is_admin())
  with check (bucket_id = 'sd-media' and public.sd_is_admin());

drop policy if exists sd_media_admin_delete on storage.objects;
create policy sd_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sd-media' and public.sd_is_admin());

-- Check: should return one row, public = true
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'sd-media';
