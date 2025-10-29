# API Endpoints Documentation

This document outlines the API endpoints that the frontend will interact with, including Supabase Edge Functions, Postgres RPCs, and PostgREST endpoints.

## Supabase Edge Functions

### POST /functions/v1/submit-attendance

*   **Description**: Submits an attendance record for the authenticated user at a specific site.
*   **Method**: `POST`
*   **Path**: `/functions/v1/submit-attendance`
*   **Authentication**: Supabase session (JWT in `Authorization` header). The Edge Function internally uses the service role key to bypass RLS for insertion, but the user must be authenticated.
*   **Request JSON**:
    ```json
    {
      "site_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
          "user_id": "some_user_id",
          "site_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "check_in_time": "2025-10-28T10:00:00Z",
          "status": "approved"
        }
      ]
    }
    ```
*   **Possible Error Codes**:
    *   `400 Bad Request`: Missing `site_id` in request body.
    *   `405 Method Not Allowed`: If not a POST request.
    *   `500 Internal Server Error`: Supabase insertion error, or missing environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### POST /functions/v1/generate-invoice

*   **Description**: Generates an invoice for a given enrollment and returns a signed URL to access the generated PDF.
*   **Method**: `POST`
*   **Path**: `/functions/v1/generate-invoice`
*   **Authentication**: Server uses Supabase service key (no direct user authentication required for this endpoint, but the calling server must be authorized).
*   **Request JSON**:
    ```json
    {
      "enrollment_id": "f1e2d3c4-b5a6-7890-1234-567890abcdef"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "invoice": {
          "id": "g1h2i3j4-k5l6-7890-1234-567890abcdef",
          "enrollment_id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
          "amount": 123.45,
          "currency": "USD",
          "status": "generated",
          "generated_at": "2025-10-28T10:30:00Z"
        },
        "signedUrl": "https://your_supabase_url.supabase.co/storage/v1/object/sign/invoices/invoice_g1h2i3j4-k5l6-7890-1234-567890abcdef.pdf?token=..."
      }
    }
    ```
*   **Possible Error Codes**:
    *   `400 Bad Request`: Missing `enrollment_id` in request body.
    *   `405 Method Not Allowed`: If not a POST request.
    *   `500 Internal Server Error`: Supabase invoice insert error, signed URL generation error, or missing environment variables.

## Postgres RPC (Remote Procedure Call)

### POST /rpc/submit_attendance

*   **Description**: Submits an attendance record directly via a Postgres function. This function handles validation based on attendance rules.
*   **Method**: `POST`
*   **Path**: `/rpc/submit_attendance`
*   **Authentication**: Supabase session (JWT in `Authorization` header). RLS policies on the `attendance` table and `enrollments` table will apply.
*   **Request JSON**:
    ```json
    {
      "p_site": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "p_checkin": "2025-10-28T10:00:00Z"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    [
      {
        "id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "status": "approved"
      }
    ]
    ```
*   **Possible Error Codes**:
    *   `400 Bad Request`: Invalid input parameters (e.g., `p_site` not a valid UUID, `p_checkin` not a valid timestamp).
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `403 Forbidden`: RLS policy denies access (e.g., user not enrolled in the site).
    *   `500 Internal Server Error`: Database error during function execution (e.g., "User is not enrolled in this site.").

## PostgREST Endpoints

These endpoints leverage PostgREST to provide a RESTful interface directly to the Supabase database tables. Authentication is handled via Supabase JWT, and Row Level Security (RLS) policies are enforced.

### GET /rest/v1/users?auth_uid=eq.<uid>

*   **Description**: Retrieves user details filtered by their authentication UID.
*   **Method**: `GET`
*   **Path**: `/rest/v1/users`
*   **Authentication**: Supabase session (JWT in `Authorization` header). RLS policies on the `users` table will apply.
*   **Query Parameters**:
    *   `auth_uid=eq.<uid>`: Filters users where `auth_uid` column equals the provided `<uid>`.
*   **Sample Request**:
    ```
    GET /rest/v1/users?auth_uid=eq.f1e2d3c4-b5a6-7890-1234-567890abcdef
    ```
*   **Sample Response (200 OK)**:
    ```json
    [
      {
        "id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "auth_uid": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "email": "user@example.com",
        "display_name": "John Doe",
        "created_at": "2025-10-28T09:00:00Z"
      }
    ]
    ```
*   **Possible Error Codes**:
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `403 Forbidden`: RLS policy denies access.
    *   `404 Not Found`: No user found with the specified `auth_uid`.

### GET /rest/v1/tasks

*   **Description**: Retrieves a list of tasks. Can be filtered and paginated using standard PostgREST query parameters.
*   **Method**: `GET`
*   **Path**: `/rest/v1/tasks`
*   **Authentication**: Supabase session (JWT in `Authorization` header). RLS policies on the `tasks` table will apply.
*   **Sample Request**:
    ```
    GET /rest/v1/tasks?status=eq.pending&order=due_date.asc
    ```
*   **Sample Response (200 OK)**:
    ```json
    [
      {
        "id": "t1a2b3c4-d5e6-7890-1234-567890abcdef",
        "title": "Complete onboarding documents",
        "description": "Upload all required documents for onboarding.",
        "assigned_to": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "due_date": "2025-11-01T00:00:00Z",
        "status": "pending",
        "created_at": "2025-10-20T09:00:00Z"
      }
    ]
    ```
*   **Possible Error Codes**:
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `403 Forbidden`: RLS policy denies access.

### GET /rest/v1/leaves

*   **Description**: Retrieves a list of leave requests. Can be filtered and paginated.
*   **Method**: `GET`
*   **Path**: `/rest/v1/leaves`
*   **Authentication**: Supabase session (JWT in `Authorization` header). RLS policies on the `leaves` table will apply.
*   **Sample Request**:
    ```
    GET /rest/v1/leaves?user_id=eq.f1e2d3c4-b5a6-7890-1234-567890abcdef&status=eq.approved
    ```
*   **Sample Response (200 OK)**:
    ```json
    [
      {
        "id": "l1e2a3v4-e5f6-7890-1234-567890abcdef",
        "user_id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "start_date": "2025-12-25",
        "end_date": "2025-12-26",
        "reason": "Holiday",
        "status": "approved",
        "created_at": "2025-10-15T10:00:00Z"
      }
    ]
    ```
*   **Possible Error Codes**:
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `403 Forbidden`: RLS policy denies access.

### GET /rest/v1/invoices

*   **Description**: Retrieves a list of invoices. Can be filtered and paginated.
*   **Method**: `GET`
*   **Path**: `/rest/v1/invoices`
*   **Authentication**: Supabase session (JWT in `Authorization` header). RLS policies on the `invoices` table will apply.
*   **Sample Request**:
    ```
    GET /rest/v1/invoices?enrollment_id=eq.f1e2d3c4-b5a6-7890-1234-567890abcdef&status=eq.generated
    ```
*   **Sample Response (200 OK)**:
    ```json
    [
      {
        "id": "i1n2v3o4-i5c6-7890-1234-567890abcdef",
        "enrollment_id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
        "amount": 150.75,
        "currency": "USD",
        "status": "generated",
        "generated_at": "2025-10-28T11:00:00Z",
        "paid_at": null
      }
    ]
    ```
*   **Possible Error Codes**:
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `403 Forbidden`: RLS policy denies access.