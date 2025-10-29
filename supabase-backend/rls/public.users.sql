-- This RLS policy file defines access control for the `public.users` table.
-- It ensures that users can only access and modify their own profiles,
-- while granting full administrative access to users with 'admin' or 'ops' roles.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for self-access: authenticated users can SELECT, UPDATE their own profile row.
CREATE POLICY "Self access for users" ON public.users
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = auth_uid)
WITH CHECK (auth.uid() = auth_uid);

-- Policy for role-based admin: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to users" ON public.users
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());