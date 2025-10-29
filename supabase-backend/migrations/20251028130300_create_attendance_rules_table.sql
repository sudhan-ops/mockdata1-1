-- This migration script creates the `attendance_rules` table in the public schema.
-- This table defines rules for attendance, such as minimum and maximum check-in times
-- for specific sites and days of the week.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.attendance_rules` (if applicable) defined in separate files.
-- 3. Set up `updated_at` trigger for the table.

CREATE TABLE IF NOT EXISTS public.attendance_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid REFERENCES public.sites(id),
    day_of_week text NOT NULL, -- e.g., 'monday', 'tuesday'
    min_checkin_time timestamptz,
    max_checkin_time timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS attendance_rules_site_id_idx ON public.attendance_rules (site_id);
CREATE INDEX IF NOT EXISTS attendance_rules_day_of_week_idx ON public.attendance_rules (day_of_week);

-- Enable Row Level Security (RLS) for the attendance_rules table
ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;