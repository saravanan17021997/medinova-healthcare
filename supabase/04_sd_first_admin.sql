-- =====================================================================
-- SaraDev Healthcare: make yourself the first admin (step 4 of 4)
-- ---------------------------------------------------------------------
-- BEFORE running this:
--   1. Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--   2. Enter your email and a strong password, tick "Auto Confirm User", Create.
--      (Do not change Authentication settings: they are shared with the other app.)
--   3. Put that same email on the line marked "CHANGE THIS", then Run.
-- =====================================================================

with me as (
  select 'YOUR-EMAIL@example.com'::text as email   -- <-- CHANGE THIS
)
insert into public.sd_admins (user_id, email, role)
select u.id, lower(u.email), 'owner'
from auth.users u, me
where lower(u.email) = lower(trim(me.email))
on conflict (user_id) do update set role = 'owner';

-- Check: should show exactly 1 row with role = owner.
-- If it shows 0 rows, the email does not match the user you created.
select user_id, email, role, created_at from public.sd_admins;
