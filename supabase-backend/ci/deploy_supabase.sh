#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Logging into Supabase CLI..."
# Supabase CLI expects SUPABASE_ACCESS_TOKEN to be available in the CI environment.
# This token can be generated from your Supabase dashboard under Account -> Access Tokens.
supabase login

echo "Applying database migrations..."
# Option 1: Push all local migrations to the linked Supabase project.
# This is generally preferred for CI/CD as it ensures the schema
# is always in sync with your local migrations folder.
supabase db push

# Option 2: Apply specific migrations.
# If you need more granular control, you can apply migrations one by one.
# Example: supabase migration apply --file 20241028123000_initial_schema.sql
# For this script, `supabase db push` is sufficient for a typical CI/CD flow.

echo "Deploying Edge Functions..."
# Deploy each edge function individually.
# The `supabase functions deploy` command will automatically pick up the
# `index.ts` (or `index.js`) file within each function's directory.
# It's good practice to specify the function name.

# Example for a single function:
# supabase functions deploy generate-invoice --project-ref your-project-ref

# To deploy all functions, you can iterate through the edge-functions directory:
for f in supabase-backend/edge-functions/*; do
  if [ -d "$f" ]; then
    FUNCTION_NAME=$(basename "$f")
    echo "Deploying function: $FUNCTION_NAME"
    supabase functions deploy "$FUNCTION_NAME" --project-ref "$SUPABASE_PROJECT_REF"
  fi
done

echo "Setting Supabase Secrets..."
# Supabase secrets can be set via the CLI or the Supabase Dashboard.
# For CI/CD, it's recommended to set them as environment variables in your CI provider
# and then pass them to the `supabase secrets set` command.
# Example:
# supabase secrets set --env-file .env.production

# Alternatively, you can set individual secrets:
# supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project-ref "$SUPABASE_PROJECT_REF"
# supabase secrets set SENDGRID_API_KEY="$SENDGRID_API_KEY" --project-ref "$SUPABASE_PROJECT_REF"

echo "Deployment script finished."