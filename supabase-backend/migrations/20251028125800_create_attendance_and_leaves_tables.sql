-- This migration script creates the `attendance` and `leaves` tables in the public schema.
-- The `attendance` table records user check-in and check-out times at specific sites.
-- The `leaves` table manages leave requests, including type, dates, status, and approval.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.attendance` and `public.leaves` defined in separate files.
-- 3. Set up `updated_at` triggers for both tables.

-- Create public.attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    site_id uuid REFERENCES public.sites(id),
    check_in timestamptz,
    check_out timestamptz,
    status text,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on attendance.user_id, attendance.site_id, attendance.created_at, attendance.status for faster lookups
CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON public.attendance (user_id);
CREATE INDEX IF NOT EXISTS attendance_site_id_idx ON public.attendance (site_id);
CREATE INDEX IF NOT EXISTS attendance_created_at_idx ON public.attendance (created_at);
CREATE INDEX IF NOT EXISTS attendance_status_idx ON public.attendance (status);

-- Enable Row Level Security (RLS) for the attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create public.leaves table
CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    leave_type text,
    start_date date,
    end_date date,
    status text,
    approver_id uuid REFERENCES public.users(id),
    reason text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on leaves.user_id, leaves.approver_id, leaves.created_at, leaves.status for faster lookups
CREATE INDEX IF NOT EXISTS leaves_user_id_idx ON public.leaves (user_id);
CREATE INDEX IF NOT EXISTS leaves_approver_id_idx ON public.leaves (approver_id);
CREATE INDEX IF NOT EXISTS leaves_created_at_idx ON public.leaves (created_at);
CREATE INDEX IF NOT EXISTS leaves_status_idx ON public.leaves (status);

-- Enable Row Level Security (RLS) for the leaves table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;