# Paradigm Onboarding - Supabase Backend

## Prerequisites

*   Supabase CLI
*   Deno (for Edge Functions)

## Environment Variables

*   `SUPABASE_URL`: Your Supabase URL
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key

## Setup

1.  Install Supabase CLI: `npm install -g @supabase/cli`
2.  Login to Supabase: `supabase login`
3.  Initialize Supabase project: `supabase init`
4.  Apply migrations: `supabase db push`
5.  Seed the database: `supabase db seed`
6.  Deploy Edge Functions: `supabase functions deploy`

## Running Locally

1.  Start the Supabase Studio: `supabase start`

## Deployment

This section outlines the steps to deploy the Supabase backend, including database migrations and edge functions.

### Step-by-step Deployment Instructions

1.  **Install Supabase CLI**: If you haven't already, install the Supabase CLI globally:
    ```bash
    npm install -g supabase
    ```

2.  **Login to Supabase**: Authenticate the Supabase CLI with your Supabase account. This command expects the `SUPABASE_ACCESS_TOKEN` environment variable to be set, especially in CI/CD environments. You can generate an access token from your Supabase dashboard under "Account Settings" -> "Access Tokens".
    ```bash
    supabase login
    ```

3.  **Link your project**: Link your local Supabase project to your remote Supabase project. Replace `your-project-ref` with your actual Supabase project reference.
    ```bash
    supabase link --project-ref your-project-ref
    ```

4.  **Apply Database Migrations**: Push your local database migrations to your Supabase project. This will update your database schema.
    ```bash
    supabase db push
    ```

5.  **Deploy Edge Functions**: Deploy all your Supabase Edge Functions. The `deploy_supabase.sh` script automates this process.
    ```bash
    ./ci/deploy_supabase.sh
    ```
    *Note: The `deploy_supabase.sh` script handles logging in, applying migrations, and deploying all edge functions.*

6.  **Set Supabase Secrets (Optional but Recommended)**: If your edge functions or other parts of your backend rely on secrets, you can set them via the Supabase CLI. It's best practice to manage these as environment variables in your CI/CD pipeline.
    ```bash
    # Example: Setting secrets from a .env file (e.g., .env.production)
    # supabase secrets set --env-file .env.production --project-ref your-project-ref

    # Example: Setting individual secrets
    # supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project-ref your-project-ref
    ```
    Alternatively, you can set secrets directly in the Supabase Dashboard under "Project Settings" -> "Secrets".

### GitHub Actions Snippet for CI/CD

Here's a sample GitHub Actions workflow snippet that demonstrates how to run migrations and deploy functions automatically.

```yaml
name: Deploy Supabase Backend

on:
  push:
    branches:
      - main # or your deployment branch
    paths:
      - 'supabase-backend/**' # Trigger only when changes are in the supabase-backend directory

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x # Use the appropriate Deno version

      - name: Install Supabase CLI
        run: npm install -g supabase

      - name: Login to Supabase and Deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }} # Your Supabase project reference
        run: |
          cd supabase-backend
          chmod +x ./ci/deploy_supabase.sh
          ./ci/deploy_supabase.sh
```

## Notes

*   Ensure that you have the correct permissions to deploy Edge Functions.
*   Update the environment variables in the `.env.local` file.
*   The `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` should be stored as GitHub Secrets in your repository.