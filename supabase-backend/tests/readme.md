# Supabase Backend Tests

This directory contains a Postman collection with sample requests to test the Supabase backend.

## How to Run Tests

1.  **Import the Postman Collection:**
    *   Open Postman.
    *   Click on "Import" and select the `postman_collection.json` file from this directory.

2.  **Set Up Environment Variables:**
    *   In Postman, create a new environment or select an existing one.
    *   Add the following variables:
        *   `SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project-id.supabase.co`)
        *   `SUPABASE_ANON_KEY`: Your Supabase public anon key.
        *   `USER_ID`: (Initially empty) This will be populated after a successful user registration.
        *   `USER_AUTH_TOKEN`: (Initially empty) This will be populated after a successful user registration/login.
        *   `ADMIN_AUTH_TOKEN`: (Initially empty) An auth token for an admin user, if applicable for testing approval flows.
        *   `LEAVE_ID`: (Initially empty) This will be populated after a successful leave request.
        *   `YOUR_SITE_ID`: Replace with an actual site ID from your database for attendance and leave tests.

3.  **Run the Tests in Order:**

    *   **Auth -> Register User:**
        *   Send this request to register a new user.
        *   **Expectation:** A successful response will include a `user` object with an `id` and an `access_token`. Copy the `id` to the `USER_ID` environment variable and the `access_token` to the `USER_AUTH_TOKEN` environment variable.

    *   **User Profile -> Create User Profile Row:**
        *   Send this request after registering a user and setting `USER_ID`.
        *   **Expectation:** A successful response will create a new row in the `public.users` table.

    *   **User Profile -> Read Own User Profile:**
        *   Send this request after setting `USER_AUTH_TOKEN`.
        *   **Expectation:** A successful response will return the profile data for the registered user.

    *   **User Profile -> Try to Read Another User's Profile (Should Fail):**
        *   Modify the `ANOTHER_USER_ID` in the URL to a different, non-existent, or unauthorized user ID.
        *   **Expectation:** This request should fail with a permission error (e.g., HTTP 401 or 403), demonstrating Row Level Security (RLS).

    *   **Attendance -> Insert Attendance (Positive Test):**
        *   Ensure `USER_ID`, `USER_AUTH_TOKEN`, and `YOUR_SITE_ID` are set.
        *   **Expectation:** A successful response will insert an attendance record.

    *   **Attendance -> Insert Attendance (Negative Test - Missing Data):**
        *   Ensure `USER_ID`, `USER_AUTH_TOKEN`, and `YOUR_SITE_ID` are set.
        *   **Expectation:** This request should fail due to missing required data (e.g., `check_out_time`), demonstrating database constraints or function validation.

    *   **Leaves -> Request Leave:**
        *   Ensure `USER_ID` and `USER_AUTH_TOKEN` are set.
        *   **Expectation:** A successful response will create a new leave request with a `pending` status. Copy the `id` from the response to the `LEAVE_ID` environment variable.

    *   **Leaves -> Approve Leave:**
        *   Ensure `LEAVE_ID` and `ADMIN_AUTH_TOKEN` are set.
        *   **Expectation:** A successful response will update the leave request status to `approved`.