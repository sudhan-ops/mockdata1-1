-- This migration script creates various miscellaneous tables in the public schema.
-- It includes tables for uniforms, verification costs, user activity logs,
-- client management, and API settings.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for client-exposed tables defined in separate files.
-- 3. Set up `updated_at` triggers for all tables.

-- Create public.uniforms table
CREATE TABLE IF NOT EXISTS public.uniforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    item_name text,
    quantity integer,
    status text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on uniforms.user_id, uniforms.created_at, uniforms.status for faster lookups
CREATE INDEX IF NOT EXISTS uniforms_user_id_idx ON public.uniforms (user_id);
CREATE INDEX IF NOT EXISTS uniforms_created_at_idx ON public.uniforms (created_at);
CREATE INDEX IF NOT EXISTS uniforms_status_idx ON public.uniforms (status);

-- Enable Row Level Security (RLS) for the uniforms table
ALTER TABLE public.uniforms ENABLE ROW LEVEL SECURITY;

-- Create public.verification_costs table
CREATE TABLE IF NOT EXISTS public.verification_costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    cost_type text,
    amount numeric,
    status text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on verification_costs.user_id, verification_costs.created_at, verification_costs.status for faster lookups
CREATE INDEX IF NOT EXISTS verification_costs_user_id_idx ON public.verification_costs (user_id);
CREATE INDEX IF NOT EXISTS verification_costs_created_at_idx ON public.verification_costs (created_at);
CREATE INDEX IF NOT EXISTS verification_costs_status_idx ON public.verification_costs (status);

-- Enable Row Level Security (RLS) for the verification_costs table
ALTER TABLE public.verification_costs ENABLE ROW LEVEL SECURITY;

-- Create public.user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    activity_type text,
    description text,
    ip_address text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on user_activity_logs.user_id, user_activity_logs.created_at, user_activity_logs.activity_type for faster lookups
CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_idx ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS user_activity_logs_created_at_idx ON public.user_activity_logs (created_at);
CREATE INDEX IF NOT EXISTS user_activity_logs_activity_type_idx ON public.user_activity_logs (activity_type);

-- Enable Row Level Security (RLS) for the user_activity_logs table
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create public.client_managements table
CREATE TABLE IF NOT EXISTS public.client_managements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name text,
    contact_person text,
    contact_email text,
    status text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on client_managements.created_at, client_managements.status for faster lookups
CREATE INDEX IF NOT EXISTS client_managements_created_at_idx ON public.client_managements (created_at);
CREATE INDEX IF NOT EXISTS client_managements_status_idx ON public.client_managements (status);

-- Enable Row Level Security (RLS) for the client_managements table
ALTER TABLE public.client_managements ENABLE ROW LEVEL SECURITY;

-- Create public.api_settings table
CREATE TABLE IF NOT EXISTS public.api_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name text UNIQUE NOT NULL,
    setting_value jsonb,
    status text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on api_settings.created_at, api_settings.status for faster lookups
CREATE INDEX IF NOT EXISTS api_settings_created_at_idx ON public.api_settings (created_at);
CREATE INDEX IF NOT EXISTS api_settings_status_idx ON public.api_settings (status);

-- Enable Row Level Security (RLS) for the api_settings table
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;