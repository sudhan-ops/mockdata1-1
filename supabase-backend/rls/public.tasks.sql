-- This RLS policy file defines access control for the `public.tasks` table.
-- It ensures that:
-- 1. Users can access (SELECT, INSERT, UPDATE, DELETE) tasks assigned to them or created by them.
-- 2. Users with 'admin' or 'ops' roles have full access to all tasks.
-- 3. Managers can access (SELECT, INSERT, UPDATE, DELETE) tasks for users within sites they manage.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for role-based admin: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to tasks" ON public.tasks
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());

-- Policy for self-access: authenticated users can SELECT, UPDATE their own tasks.
CREATE POLICY "Self access for tasks" ON public.tasks
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = created_by) -- assigned_to and created_by are already UUID, no need for ::text::uuid cast
WITH CHECK (auth.uid() = assigned_to OR auth.uid() = created_by); -- assigned_to and created_by are already UUID, no need for ::text::uuid cast

-- Policy for managers: managers can SELECT/INSERT/UPDATE/DELETE tasks for users in their managed sites.
CREATE POLICY "Managers access tasks for their sites" ON public.tasks
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.sites s ON u.site_id = s.id
    WHERE u.id = public.tasks.assigned_to AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.sites s ON u.site_id = s.id
    WHERE u.id = public.tasks.assigned_to AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
);