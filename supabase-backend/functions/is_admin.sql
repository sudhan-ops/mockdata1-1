-- This function checks if the currently authenticated user has 'admin' or 'ops' roles.
-- It is used to enforce role-based access control within RLS policies and other functions.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Deploy this function to Supabase.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- SECURITY DEFINER is used here because the function needs to query the 'users' and 'roles' tables,
                 -- which might have RLS policies that would prevent a regular user from accessing this information directly.
                 -- This allows the function to bypass RLS for these specific tables to perform its role check.
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.name INTO user_role
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_uid = auth.uid();

  RETURN user_role IN ('admin', 'ops');
END;
$$;