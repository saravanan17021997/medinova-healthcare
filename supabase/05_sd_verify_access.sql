-- =====================================================================
-- SaraDev Healthcare: security check (read-only, changes nothing)
-- Every row should show ok = true. Uses no passwords or keys.
-- =====================================================================
select check_name, ok from (values
  (1,  'Owner account is linked to a real login',
        exists (select 1 from public.sd_admins a join auth.users u on u.id = a.user_id where a.role = 'owner')),
  (2,  'Owner login email is confirmed',
        exists (select 1 from public.sd_admins a join auth.users u on u.id = a.user_id
                where a.role = 'owner' and u.email_confirmed_at is not null)),
  (3,  'Row Level Security is ON for all 15 sd_ tables',
        (select count(*) from pg_tables where schemaname = 'public' and tablename like 'sd\_%' and rowsecurity) = 15),
  (4,  'Logged-in users can read only their own admin row',
        exists (select 1 from pg_policies where tablename = 'sd_admins' and policyname = 'sd_admins_read'
                and qual like '%auth.uid()%')),
  (5,  'Only owners can change the admin list',
        exists (select 1 from pg_policies where tablename = 'sd_admins' and policyname = 'sd_admins_owner_write'
                and qual like '%sd_is_owner()%')),
  (6,  'Dashboard function refuses non-admins',
        coalesce((select prosecdef and prosrc like '%sd_is_admin()%' from pg_proc where proname = 'sd_admin_dashboard'), false)),
  (7,  'Visitors cannot read appointments',
        not has_table_privilege('anon', 'public.sd_appointments', 'SELECT')),
  (8,  'Visitors cannot read orders',
        not has_table_privilege('anon', 'public.sd_orders', 'SELECT')),
  (9,  'Visitors cannot read the admin list',
        not has_table_privilege('anon', 'public.sd_admins', 'SELECT')),
  (10, 'Visitors cannot change products',
        not has_table_privilege('anon', 'public.sd_products', 'UPDATE')),
  (11, 'Admin panel cannot mark orders as paid',
        not has_column_privilege('authenticated', 'public.sd_orders', 'payment_status', 'UPDATE')),
  (12, 'Visitors cannot open the dashboard function',
        not has_function_privilege('anon', 'public.sd_admin_dashboard()', 'EXECUTE')),
  (13, 'Money Map tables still have their 3 policies',
        (select count(*) from pg_policies where schemaname = 'public' and tablename in ('budgets', 'profiles', 'transactions')) = 3)
) as t(n, check_name, ok)
order by n;
