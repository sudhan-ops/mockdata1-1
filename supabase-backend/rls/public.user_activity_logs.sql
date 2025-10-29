-- This RLS policy file defines access control for the `public.user_activity_logs` table.
-- It ensures that:
-- 1. Users can only select their own activity logs.
-- 2. Users with 'admin' or 'ops' roles have full access to all activity logs.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for role-based admin: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to user_activity_logs" ON public.user_activity_logs
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());

-- Policy for self-access: authenticated users can SELECT their own activity logs.
CREATE POLICY "Self access for user_activity_logs" ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id); -- user_id is already UUID, no need for ::text::uuid cast