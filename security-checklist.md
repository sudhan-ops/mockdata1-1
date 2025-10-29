# Security Checklist & Notes

This document outlines key security considerations for the project, particularly concerning Supabase integration and secret management.

## Supabase Service Role Key

*   **Never commit `SUPABASE_SERVICE_ROLE` to the repository.** This key grants full administrative privileges to your Supabase project and must be kept strictly confidential.
*   **Use `SUPABASE_SERVICE_ROLE` only in Edge Functions or CI/CD environments.** Restrict its usage to server-side, controlled environments where direct client exposure is avoided.

## Row Level Security (RLS)

*   **Use RLS on all client-exposed tables.** Implement Row Level Security policies to ensure that users can only access data they are authorized to view or modify.

## Token Exposure Prevention

*   **Use `httpOnly` cookies & a server proxy if you need to prevent token exposure.** This is crucial for protecting authentication tokens from client-side JavaScript access, mitigating XSS risks.
*   **Note:** The frontend typically uses the anonymous key for initial interactions.

## Database Indexes for RLS Policies

*   **Add database indexes for columns used in RLS policies.** For example, columns like `auth_uid` or `user_id` that are frequently referenced in RLS conditions should be indexed to improve query performance and reduce latency.

## Secrets Required by Edge Functions

The following secrets may be required by Edge Functions:

*   `SUPABASE_SERVICE_ROLE`: For administrative actions within Edge Functions.
*   `SENDGRID_API_KEY`: (If used) For sending emails via SendGrid.
*   `SENTRY_DSN`: (Optional) For error tracking and monitoring with Sentry.