# Send Welcome Email Edge Function

This Edge Function sends a welcome email to a new user using a 3rd-party SMTP/SendGrid API and logs the activity in the `user_activity_logs` table. It supports a mock implementation for local development.

## Environment Variables

*   `SUPABASE_URL`: Your Supabase project URL.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
*   `SENDGRID_API_KEY`: Your SendGrid API key (required if `USE_MOCK_EMAIL` is not `true`).
*   `USE_MOCK_EMAIL`: Set to `true` for local development to mock email sending.

## Local Development

1.  Navigate to the `supabase-backend/edge-functions/send-welcome-email` directory.
2.  Install dependencies: `npm install`
3.  Start the Supabase Edge Function locally: `supabase functions serve --no-verify-jwt`

## Deployment

1.  Navigate to the `supabase-backend/edge-functions/send-welcome-email` directory.
2.  Deploy the function to Supabase: `supabase functions deploy send-welcome-email --no-verify-jwt`