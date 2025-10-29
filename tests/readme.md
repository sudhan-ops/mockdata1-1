# API Testing with Postman

This directory contains a Postman collection for testing the Supabase backend API.

## Getting Started

1.  **Install Postman**: If you don't have Postman installed, download it from [https://www.postman.com/downloads/](https://www.postman.com/downloads/).

2.  **Import the Collection**:
    *   Open Postman.
    *   Click on "Import" in the top left corner.
    *   Select the `postman_collection.json` file from this directory.

3.  **Configure Environment Variables**:
    The Postman collection uses environment variables for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
    *   In Postman, click on the "Environments" dropdown (usually next to the "Eye" icon in the top right).
    *   Click on "Manage Environments" and then "Add".
    *   Name your environment (e.g., "Local Supabase" or "Production Supabase").
    *   Add the following variables:
        *   `SUPABASE_URL`: Your Supabase project URL (e.g., `http://localhost:54321` for local, or your project URL for production).
        *   `SUPABASE_ANON_KEY`: Your Supabase public `anon` key.
    *   Select your newly created environment from the dropdown.

## Running Tests

The collection includes example requests for:

*   **Auth - Sign Up**: Registering a new user.
*   **Auth - Sign In**: Logging in an existing user and obtaining a session token.
*   **RPC - is_admin**: Calling a Supabase RPC function.
*   **Edge Function - generate-invoice**: Invoking a Supabase Edge Function.

To run a request:

1.  Select the desired request from the collection sidebar.
2.  Update the request body or parameters as needed (e.g., user email/password for auth requests, `enrollment_id` for `generate-invoice`).
3.  Click the "Send" button.

## Authentication

For requests that require authentication (e.g., `is_admin` RPC, `generate-invoice` Edge Function), you will need to include an `Authorization` header with a Bearer token.

1.  After a successful "Auth - Sign In" request, the response will contain an `access_token`.
2.  Copy this `access_token`.
3.  In the subsequent authenticated requests, go to the "Authorization" tab, select "Bearer Token", and paste the `access_token` into the "Token" field.
    *Alternatively, you can set up a Postman environment variable to automatically capture and use the token.*

## Extending the Collection

You can extend this collection by adding more requests for your specific API endpoints, RPCs, and Edge Functions. Organize them logically into folders for better management.