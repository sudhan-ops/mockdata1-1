# Project Name

This project is a [brief description of the project]. It utilizes Supabase for its backend services, including database, authentication, and edge functions. The frontend is built with [mention frontend framework if known, e.g., React, Next.js].

## Local Development

To set up the project for local development, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone [repository_url]
    cd [project_directory]
    ```

2.  **Install dependencies**:
    ```bash
    npm install # or yarn install
    ```

3.  **Set up Supabase locally**:
    If you have the Supabase CLI installed, you can link your local project to your Supabase project and run local services.
    ```bash
    supabase login
    supabase init
    supabase link --project-ref your-supabase-project-ref
    supabase start
    ```
    This will start local Supabase services, including a local database.

4.  **Apply migrations and seed data**:
    ```bash
    supabase db push
    supabase seeds run
    ```

5.  **Configure environment variables**:
    Create a `.env.local` file in the root directory and add the following environment variables:

    ```
    SUPABASE_URL="YOUR_LOCAL_SUPABASE_URL" # e.g., http://localhost:54321
    SUPABASE_ANON_KEY="YOUR_LOCAL_SUPABASE_ANON_KEY"
    SUPABASE_SERVICE_ROLE="YOUR_LOCAL_SUPABASE_SERVICE_ROLE_KEY"
    SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY" # Optional, for email functionality
    # GCP_* variables if any for hosting front-end (e.g., GCP_PROJECT_ID, GCP_REGION)
    ```
    You can find your local Supabase URL and keys after running `supabase start`.

6.  **Run the development server**:
    ```bash
    npm run dev # or yarn dev
    ```

    The application should now be running locally, typically at `http://localhost:3000`.

## Deployment to Supabase

To deploy your Supabase backend changes (migrations, functions, edge functions) to a remote Supabase project:

1.  **Ensure Supabase CLI is configured and linked**:
    ```bash
    supabase login
    supabase link --project-ref your-supabase-project-ref
    ```

2.  **Deploy database migrations**:
    ```bash
    supabase db push
    ```

3.  **Deploy Edge Functions**:
    ```bash
    supabase functions deploy --project-ref your-supabase-project-ref
    ```
    (You might need to deploy each function individually or use a script if you have many).

4.  **Deploy Storage**:
    Storage buckets are typically managed through the Supabase UI or specific CLI commands if you have a `storage` folder with definitions.

## Required Environment Variables

The following environment variables are required for the application to function correctly:

-   `SUPABASE_URL`: The public URL of your Supabase project.
-   `SUPABASE_ANON_KEY`: The public `anon` key for your Supabase project (used by the frontend).
-   `SUPABASE_SERVICE_ROLE`: The `service_role` key for your Supabase project (used by backend services and edge functions). **Keep this key secure and never expose it on the frontend.**
-   `SENDGRID_API_KEY`: (Optional) API key for SendGrid, used for sending emails (e.g., welcome emails).
-   `GCP_*`: Any Google Cloud Platform related environment variables if you are hosting your frontend or other services on GCP (e.g., `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_BUCKET_NAME` for static site hosting).

## Project Structure

-   `migrations/`: SQL files for database schema changes.
-   `functions/`: SQL RPC functions.
-   `edge-functions/`: TypeScript functions deployed as Supabase Edge Functions.
-   `seeds/`: SQL seed data (e.g., `seed_roles.sql`).
-   `storage_buckets.md`: Documentation for Supabase storage buckets.
-   `ci/`: Continuous Integration/Deployment scripts.
-   `tests/`: Postman collection and documentation for API tests.
-   `security-checklist.md`: Security checklist for the project.
