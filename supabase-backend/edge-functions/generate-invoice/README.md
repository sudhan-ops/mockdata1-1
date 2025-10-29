# Generate Invoice Edge Function

This Edge Function generates an invoice record, writes its metadata to the `invoices` table, optionally uploads a placeholder PDF to the `invoices` storage bucket, and returns a signed URL for the PDF.

## Environment Variables

*   `SUPABASE_URL`: Your Supabase project URL.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.

## Local Development

1.  Navigate to the `supabase-backend/edge-functions/generate-invoice` directory.
2.  Install dependencies: `npm install`
3.  Start the Supabase Edge Function locally: `supabase functions serve --no-verify-jwt`

## Deployment

1.  Navigate to the `supabase-backend/edge-functions/generate-invoice` directory.
2.  Deploy the function to Supabase: `supabase functions deploy generate-invoice --no-verify-jwt`