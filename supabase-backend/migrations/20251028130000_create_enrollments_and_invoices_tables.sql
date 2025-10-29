-- This migration script creates the `enrollments` and `invoices` tables in the public schema.
-- The `enrollments` table tracks user enrollments to sites, including their status and metadata.
-- The `invoices` table stores invoice details related to enrollments, such as amount, currency, and payment status.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.enrollments` and `public.invoices` defined in separate files.
-- 3. Set up `updated_at` triggers for both tables.

-- Create public.enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    site_id uuid REFERENCES public.sites(id),
    status text,
    enrollment_date timestamptz DEFAULT now(),
    source text,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on enrollments.user_id, enrollments.site_id, enrollments.created_at, enrollments.status for faster lookups
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON public.enrollments (user_id);
CREATE INDEX IF NOT EXISTS enrollments_site_id_idx ON public.enrollments (site_id);
CREATE INDEX IF NOT EXISTS enrollments_created_at_idx ON public.enrollments (created_at);
CREATE INDEX IF NOT EXISTS enrollments_status_idx ON public.enrollments (status);

-- Enable Row Level Security (RLS) for the enrollments table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create public.invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid REFERENCES public.enrollments(id),
    user_id uuid REFERENCES public.users(id),
    amount numeric,
    currency text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    paid boolean,
    invoice_file text,
    meta jsonb
);

-- Create indexes on invoices.enrollment_id, invoices.user_id, invoices.created_at, invoices.paid for faster lookups
CREATE INDEX IF NOT EXISTS invoices_enrollment_id_idx ON public.invoices (enrollment_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON public.invoices (created_at);
CREATE INDEX IF NOT EXISTS invoices_paid_idx ON public.invoices (paid);

-- Enable Row Level Security (RLS) for the invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;