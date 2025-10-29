-- This RLS policy file defines access control for the `public.enrollments` table.
-- It ensures that:
-- 1. Users can access (SELECT, INSERT, UPDATE, DELETE) their own enrollment records.
-- 2. Users with 'admin' or 'ops' roles have full access to all enrollment records.
-- 3. Managers can access (SELECT, INSERT, UPDATE, DELETE) enrollment records for users within sites they manage.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policy for role-based admin: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to enrollments" ON public.enrollments
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy for self-access: authenticated users can SELECT, INSERT, UPDATE, DELETE their own enrollments.
CREATE POLICY "Self access for enrollments" ON public.enrollments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for managers: managers can SELECT/INSERT/UPDATE/DELETE enrollments for users in their managed sites.
CREATE POLICY "Managers access enrollments for their sites" ON public.enrollments
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users u JOIN public.sites s ON u.site_id = s.id WHERE u.id = public.enrollments.user_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())) OR public.is_admin())
WITH CHECK (EXISTS (SELECT 1 FROM public.users u JOIN public.sites s ON u.site_id = s.id WHERE u.id = public.enrollments.user_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())) OR public.is_admin());