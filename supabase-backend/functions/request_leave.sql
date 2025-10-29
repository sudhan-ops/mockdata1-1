-- This function allows an authenticated user to submit a leave request.
-- The leave request is initially set to 'pending' status.
-- A placeholder for approver assignment and notification is included, which should be
-- replaced with actual business logic for determining and notifying the appropriate approver.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Deploy this function to Supabase.
-- 2. Implement robust logic for `v_approver_id` assignment based on your organization's hierarchy or rules.
-- 3. Consider integrating with a notification system (e.g., email, in-app notification)
--    instead of or in addition to `user_activity_logs` for approver notification.
-- 4. Ensure RLS policies are correctly set for `public.leaves` and `public.user_activity_logs`.

CREATE OR REPLACE FUNCTION public.request_leave(p_start date, p_end date, p_type text, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- SECURITY DEFINER is used here to allow the function to insert into `leaves` and `user_activity_logs`
                 -- potentially bypassing RLS if the user does not have direct insert permissions,
                 -- which is common for RPCs that act on behalf of the user with elevated privileges.
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_leave_id uuid;
    v_approver_id uuid; -- Placeholder for the actual approver's ID
BEGIN
    v_user_id := auth.uid();

    -- Insert the leave request with 'pending' status
    INSERT INTO public.leaves (user_id, start_date, end_date, leave_type, reason, status)
    VALUES (v_user_id, p_start, p_end, p_type, p_reason, 'pending')
    RETURNING id INTO v_leave_id;

    -- TODO: Implement actual logic to determine the approver.
    -- This is a placeholder. In a real application, this would involve
    -- querying a `managers` table, `site_managers`, or a more complex
    -- approval workflow system.
    -- For example: SELECT manager_id INTO v_approver_id FROM public.sites WHERE id = (SELECT site_id FROM public.users WHERE id = v_user_id);
    -- For now, we will assume the approver will be assigned or notified by another process.
    -- SELECT id INTO v_approver_id FROM public.users WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin') LIMIT 1;

    -- Log the leave request for potential approver notification or audit
    INSERT INTO public.user_activity_logs (user_id, activity_type, description, details)
    VALUES (v_user_id, 'leave_request_submitted', 'User submitted a leave request.', jsonb_build_object('leave_id', v_leave_id, 'start_date', p_start, 'end_date', p_end, 'leave_type', p_type));

    -- If an approver was determined, you might also log an activity for them
    -- IF v_approver_id IS NOT NULL THEN
    --     INSERT INTO public.user_activity_logs (user_id, activity_type, description, details)
    --     VALUES (v_approver_id, 'leave_request_pending_approval', 'A new leave request requires your approval.', jsonb_build_object('leave_id', v_leave_id, 'requester_id', v_user_id));
    -- END IF;

    RETURN v_leave_id;
END;
$$;