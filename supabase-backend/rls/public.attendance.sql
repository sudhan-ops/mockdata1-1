-- This RLS policy file defines access control for the `public.attendance` table.
-- It ensures that:
-- 1. Users can insert, select, and update their own attendance records.
-- 2. Users with 'admin' or 'ops' roles have full access to all attendance records.
-- 3. Managers can access (SELECT, INSERT, UPDATE, DELETE) attendance records for users within sites they manage.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policy for role-based admin: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to attendance" ON public.attendance
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());

-- Policy for self-insert: authenticated users can INSERT their own attendance records.
CREATE POLICY "Authenticated user insert own attendance" ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id); -- user_id is already UUID, no need for ::text::uuid cast

-- Policy for self-select: authenticated users can SELECT their own attendance records.
CREATE POLICY "Authenticated user select own attendance" ON public.attendance
FOR SELECT
TO authenticated
USING (auth.uid() = user_id); -- user_id is already UUID, no need for ::text::uuid cast

-- Policy for self-update: authenticated users can UPDATE their own attendance records.
CREATE POLICY "Authenticated user update own attendance" ON public.attendance
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) -- user_id is already UUID, no need for ::text::uuid cast
WITH CHECK (auth.uid() = user_id); -- user_id is already UUID, no need for ::text::uuid cast

-- Policy for managers: managers can SELECT/INSERT/UPDATE/DELETE attendance records for users in their managed sites.
CREATE POLICY "Managers access attendance for their sites" ON public.attendance
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE s.id = public.attendance.site_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE s.id = public.attendance.site_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
);