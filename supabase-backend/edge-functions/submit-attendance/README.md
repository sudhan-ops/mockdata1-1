# Submit Attendance Edge Function

This Edge Function receives a `site_id` and records attendance in the Supabase `attendance` table. It can either directly insert the data using the service role key or call a Supabase RPC function.

## Environment Variables

*   `SUPABASE_URL`: Your Supabase project URL.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.

## Local Development

1.  Navigate to the `supabase-backend/edge-functions/submit-attendance` directory.
2.  Install dependencies: `npm install`
3.  Start the Supabase Edge Function locally: `supabase functions serve --no-verify-jwt`

## Deployment

1.  Navigate to the `supabase-backend/edge-functions/submit-attendance` directory.
2.  Deploy the function to Supabase: `supabase functions deploy submit-attendance --no-verify-jwt`