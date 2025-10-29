-- This migration script creates a helper function and a trigger
-- to automatically update the `updated_at` column for any table
-- that has both `created_at` and `updated_at` columns.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply this trigger to all tables that require automatic `updated_at` updates.

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the 'roles' table
CREATE TRIGGER set_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'sites' table
CREATE TRIGGER set_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'users' table
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'user_activity_logs' table
CREATE TRIGGER set_user_activity_logs_updated_at
BEFORE UPDATE ON public.user_activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'submissions' table
CREATE TRIGGER set_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'attendance' table
CREATE TRIGGER set_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'leaves' table
CREATE TRIGGER set_leaves_updated_at
BEFORE UPDATE ON public.leaves
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'tasks' table
CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'enrollments' table
CREATE TRIGGER set_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'invoices' table
CREATE TRIGGER set_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'uniforms' table
CREATE TRIGGER set_uniforms_updated_at
BEFORE UPDATE ON public.uniforms
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'verification_costs' table
CREATE TRIGGER set_verification_costs_updated_at
BEFORE UPDATE ON public.verification_costs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'client_managements' table
CREATE TRIGGER set_client_managements_updated_at
BEFORE UPDATE ON public.client_managements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Apply the trigger to the 'api_settings' table
CREATE TRIGGER set_api_settings_updated_at
BEFORE UPDATE ON public.api_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();