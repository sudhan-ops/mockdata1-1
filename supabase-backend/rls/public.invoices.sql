-- This RLS policy file defines access control for the `public.invoices` table.
-- It ensures that:
-- 1. Users can select their own invoices.
-- 2. Users with 'admin' or 'ops' roles have full access to all invoices.
-- 3. Managers can access (SELECT, INSERT, UPDATE, DELETE) invoices for users within sites they manage.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Apply this policy using Supabase CLI: `supabase db diff --local > migrations/<timestamp>_add_rls_policies.sql`
--    (or manually if already part of a migration).
-- 2. Ensure the `public.is_admin()` function is deployed and working correctly.

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy for role-based admin/finance: users with role admin or ops can SELECT / INSERT / UPDATE / DELETE across tables.
CREATE POLICY "Admin and Ops full access to invoices" ON public.invoices
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());

-- Policy for self-access: authenticated users can SELECT their own invoices.
CREATE POLICY "Self access for invoices" ON public.invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id); -- user_id is already UUID, no need for ::text::uuid cast

-- Policy for managers: managers can SELECT/INSERT/UPDATE/DELETE invoices for users in their managed sites.
CREATE POLICY "Managers access invoices for their sites" ON public.invoices
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.sites s ON u.site_id = s.id
    WHERE u.id = public.invoices.user_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.sites s ON u.site_id = s.id
    WHERE u.id = public.invoices.user_id AND s.manager_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
  ) OR public.is_admin()
);