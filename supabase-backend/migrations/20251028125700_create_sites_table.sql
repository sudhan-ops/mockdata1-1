-- This migration script creates the `sites` table in the public schema.
-- The `sites` table stores information about different operational sites,
-- including their name, location, and an assigned manager.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.sites` defined in separate files.

-- Create public.sites table
CREATE TABLE IF NOT EXISTS public.sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    location text,
    manager_id uuid REFERENCES public.users(id),
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index on sites.manager_id for faster lookups
CREATE INDEX IF NOT EXISTS sites_manager_id_idx ON public.sites (manager_id);

-- Enable Row Level Security (RLS) for the sites table
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;