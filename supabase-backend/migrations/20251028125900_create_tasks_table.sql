-- This migration script creates the `tasks` table in the public schema.
-- The `tasks` table stores information about tasks, including their title, description,
-- who they are assigned to, who created them, their status, and due date.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.tasks` defined in separate files.
-- 3. Set up `updated_at` trigger for the table.

-- Create public.tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    assigned_to uuid REFERENCES public.users(id),
    created_by uuid REFERENCES public.users(id),
    status text,
    due_date date,
    meta jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on tasks.assigned_to, tasks.created_by, tasks.created_at, tasks.status for faster lookups
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON public.tasks (created_by);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON public.tasks (created_at);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);

-- Enable Row Level Security (RLS) for the tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;