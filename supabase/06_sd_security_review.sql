-- =====================================================================
-- SaraDev Healthcare: full security review (read-only, changes nothing)
-- Run in Supabase -> SQL Editor. Every row should show ok = true.
-- "detail" explains what was found. Uses no passwords or keys.
-- =====================================================================
with
sd_tables as (
  select c.oid, c.relname, c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'sd\_%'
),
-- tables visitors are meant to read (published rows only, via policies)
public_content(t) as (values ('sd_categories'), ('sd_products'), ('sd_product_images'), ('sd_specialties'), ('sd_doctors'),
                             ('sd_facilities'), ('sd_site_settings'), ('sd_nav_links'), ('sd_page_sections')),
private_tables(t) as (values ('sd_admins'), ('sd_appointments'), ('sd_contact_messages'), ('sd_orders'), ('sd_order_items'), ('sd_audit_log')),
sd_functions as (
  select p.oid, p.proname, p.prosecdef, p.proconfig, pg_get_function_identity_arguments(p.oid) args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname like 'sd\_%'
),
-- the only functions a visitor may call
visitor_functions(f) as (values ('sd_submit_appointment'), ('sd_submit_contact'), ('sd_place_order'), ('sd_is_admin'), ('sd_is_owner')),
checks(n, check_name, ok, detail) as (
  select 1, 'Row Level Security is on for every sd_ table',
         bool_and(relrowsecurity), coalesce(string_agg(relname, ', ') filter (where not relrowsecurity), 'all ' || count(*) || ' tables')
    from sd_tables
  union all
  select 2, 'Visitors cannot insert, update or delete in any sd_ table',
         count(*) = 0, coalesce(string_agg(relname || ':' || priv, ', '), 'none')
    from sd_tables, unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) priv
   where has_table_privilege('anon', oid, priv)
  union all
  select 3, 'Visitors cannot read private tables (admins, requests, messages, orders, audit log)',
         count(*) = 0, coalesce(string_agg(t, ', '), 'none readable')
    from private_tables where has_table_privilege('anon', 'public.' || t, 'SELECT')
  union all
  select 4, 'Every public table only shows visitors published rows (or is settings)',
         count(*) = 0, coalesce(string_agg(tablename, ', '), 'all filtered')
    from public_content pc
    left join pg_policies p on p.schemaname = 'public' and p.tablename = pc.t and p.cmd = 'SELECT' and 'anon' = any (p.roles)
   where pc.t <> 'sd_site_settings' and (p.qual is null or (p.qual not like '%published%' and pc.t <> 'sd_product_images'))
  union all
  select 5, 'No sd_ policy lets visitors write',
         count(*) = 0, coalesce(string_agg(tablename || '.' || policyname, ', '), 'none')
    from pg_policies where schemaname = 'public' and tablename like 'sd\_%' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     and ('anon' = any (roles) or 'public' = any (roles))
  union all
  select 6, 'Every admin write policy checks sd_is_admin() or sd_is_owner()',
         count(*) = 0, coalesce(string_agg(tablename || '.' || policyname, ', '), 'all checked')
    from pg_policies where schemaname = 'public' and tablename like 'sd\_%' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     and coalesce(qual, '') || coalesce(with_check, '') not like '%sd_is_admin()%'
     and coalesce(qual, '') || coalesce(with_check, '') not like '%sd_is_owner()%'
  union all
  select 7, 'Orders: the browser can change only status and notes (never payment, total or items)',
         not has_column_privilege('authenticated', 'public.sd_orders', 'payment_status', 'UPDATE')
         and not has_column_privilege('authenticated', 'public.sd_orders', 'subtotal', 'UPDATE')
         and not has_column_privilege('authenticated', 'public.sd_orders', 'item_count', 'UPDATE')
         and not has_table_privilege('authenticated', 'public.sd_orders', 'INSERT')
         and not has_table_privilege('authenticated', 'public.sd_order_items', 'INSERT')
         and not has_table_privilege('authenticated', 'public.sd_order_items', 'UPDATE')
         and has_column_privilege('authenticated', 'public.sd_orders', 'status', 'UPDATE'),
         'payment_status, subtotal, item_count and order items are locked'
  union all
  select 8, 'Visitors can call only the 3 form functions (plus the admin-check helpers)',
         count(*) = 0, coalesce(string_agg(proname, ', '), 'only ' || (select string_agg(f, ', ') from visitor_functions))
    from sd_functions where has_function_privilege('anon', oid, 'EXECUTE') and proname not in (select f from visitor_functions)
  union all
  select 9, 'Every SECURITY DEFINER sd_ function has a fixed search_path',
         count(*) = 0, coalesce(string_agg(proname, ', '), 'all ' || (select count(*) from sd_functions where prosecdef) || ' fixed')
    from sd_functions where prosecdef and not coalesce(array_to_string(proconfig, ',') like '%search_path=%', false)
  union all
  select 10, 'Internal helper functions cannot be called by visitors or signed-in users',
         count(*) = 0, coalesce(string_agg(proname, ', '), 'none callable')
    from sd_functions
   where proname in ('sd_new_reference', 'sd_clean_phone', 'sd_check_email', 'sd_check_name', 'sd_set_updated_at', 'sd_protect_last_owner', 'sd_audit', 'sd_order_status_guard')
     and (has_function_privilege('anon', oid, 'EXECUTE') or has_function_privilege('authenticated', oid, 'EXECUTE'))
  union all
  select 11, 'Admin-only functions refuse visitors',
         not has_function_privilege('anon', 'public.sd_admin_dashboard()', 'EXECUTE')
         and not has_function_privilege('anon', 'public.sd_add_admin(text, text)', 'EXECUTE'),
         'sd_admin_dashboard, sd_add_admin'
  union all
  select 12, 'Admin functions check the caller themselves',
         coalesce(bool_and(prosrc like '%sd_is_admin()%' or prosrc like '%sd_is_owner()%'), false), string_agg(proname, ', ')
    from pg_proc where pronamespace = 'public'::regnamespace and proname in ('sd_admin_dashboard', 'sd_add_admin')
  union all
  select 13, 'At least one owner, linked to a confirmed login',
         count(*) >= 1, count(*) || ' owner(s): ' || coalesce(string_agg(a.email, ', '), 'none')
    from public.sd_admins a join auth.users u on u.id = a.user_id where a.role = 'owner' and u.email_confirmed_at is not null
  union all
  select 14, 'Every admin is linked to an existing login',
         count(*) = 0, coalesce(string_agg(a.email, ', '), (select count(*) from public.sd_admins) || ' admin(s), all linked')
    from public.sd_admins a left join auth.users u on u.id = a.user_id where u.id is null
  union all
  select 15, 'The last owner is protected by a trigger',
         exists (select 1 from pg_trigger where tgrelid = 'public.sd_admins'::regclass and tgname = 'sd_admins_protect_last_owner' and tgenabled <> 'D'),
         'sd_admins_protect_last_owner'
  union all
  select 16, 'Cancelled orders cannot be reopened (guard trigger is on)',
         exists (select 1 from pg_trigger where tgrelid = 'public.sd_orders'::regclass and tgname = 'sd_orders_status_guard' and tgenabled <> 'D'),
         'sd_orders_status_guard'
  union all
  select 17, 'Admin changes are recorded (audit triggers on content and admin tables)',
         count(*) >= 10, count(*) || ' audit triggers'
    from pg_trigger where tgname like 'sd\_%\_audit' and tgenabled <> 'D'
  union all
  select 18, 'Image bucket sd-media: public to read, images only, 5 MB limit',
         coalesce((select public and file_size_limit <= 5242880 and allowed_mime_types <@ array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
                     from storage.buckets where id = 'sd-media'), false),
         coalesce((select 'limit ' || file_size_limit || ' bytes; ' || array_to_string(allowed_mime_types, ', ') from storage.buckets where id = 'sd-media'), 'bucket missing')
  union all
  select 19, 'Only admins can upload, change or delete files in sd-media',
         count(*) = 4 and bool_and(coalesce(qual, '') || coalesce(with_check, '') like '%sd_is_admin()%' and not ('anon' = any (roles))),
         count(*) || ' sd_media policies'
    from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'sd\_media\_%'
  union all
  select 20, 'No sd_ table links to a non-sd_ table (except logins for the admin list)',
         count(*) = 0, coalesce(string_agg(conrelid::regclass || ' -> ' || confrelid::regclass, ', '), 'none')
    from pg_constraint
   where contype = 'f' and conrelid in (select oid from sd_tables)
     and confrelid not in (select oid from sd_tables) and confrelid <> 'auth.users'::regclass
  union all
  select 21, 'No sd_ trigger or policy sits on another app''s tables',
         count(*) = 0, coalesce(string_agg(x, ', '), 'none')
    from (select tgrelid::regclass::text || '.' || tgname x from pg_trigger
           where tgname like 'sd\_%' and tgrelid not in (select oid from sd_tables) and tgrelid <> 'storage.objects'::regclass
          union all
          select tablename || '.' || policyname from pg_policies
           where policyname like 'sd\_%' and tablename not like 'sd\_%' and not (schemaname = 'storage' and tablename = 'objects')) y
  union all
  select 22, 'Money Map tables still have their 3 policies',
         (select count(*) from pg_policies where schemaname = 'public' and tablename in ('budgets', 'profiles', 'transactions')) = 3,
         (select count(*) from pg_policies where schemaname = 'public' and tablename in ('budgets', 'profiles', 'transactions')) || ' policies'
)
select n, check_name, ok, detail from checks order by n;
