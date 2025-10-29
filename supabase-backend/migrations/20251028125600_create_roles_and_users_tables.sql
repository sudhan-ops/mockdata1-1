-- This migration script creates the `roles` and `users` tables in the public schema.
-- The `roles` table defines different user roles and their associated permissions.
-- The `users` table stores user profiles, linking them to `auth.users` for authentication
-- and to `public.roles` for authorization.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Run this migration using Supabase CLI: `supabase migration up`
-- 2. Apply RLS policies for `public.users` and `public.roles` (if applicable) defined in separate files.
-- 3. Seed initial roles data using `supabase-backend/seeds/seed_roles.sql`.

-- Create public.roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    permissions jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index on roles.name for faster lookups
CREATE INDEX IF NOT EXISTS roles_name_idx ON public.roles (name);

-- Create public.users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid uuid UNIQUE REFERENCES auth.users(id), -- Links to Supabase Auth user
    full_name text,
    email text,
    phone text,
    role_id uuid REFERENCES public.roles(id), -- Foreign key to public.roles
    profile jsonb, -- Stores additional user profile information
    status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes on users.auth_uid and users.email for faster lookups
CREATE INDEX IF NOT EXISTS users_auth_uid_idx ON public.users (auth_uid);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);