-- This function allows a designated approver or an admin to approve or reject a leave request.
-- It performs permission checks to ensure only authorized users can modify the leave status.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Deploy this function to Supabase.
-- 2. Ensure RLS policies are correctly set for `public.leaves` and `public.user_activity_logs`.
-- 3. Ensure the `is_admin()` function is deployed and working correctly.

CREATE OR REPLACE FUNCTION public.approve_leave(p_leave_id uuid, p_approver uuid, p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- SECURITY DEFINER is used here because the function needs to:
                 -- 1. Call `is_admin()` which itself uses SECURITY DEFINER to bypass RLS on `users` and `roles`.
                 -- 2. Update `public.leaves` and insert into `public.user_activity_logs`, which might be restricted by RLS
                 --    for a regular user, but this function needs to perform these actions with elevated privileges.
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_user_id uuid;
    v_leave_status text;
    v_leave_requester_id uuid;
    v_is_admin boolean;
BEGIN
    v_current_user_id := auth.uid();

    -- Check if the current user is an admin
    SELECT public.is_admin() INTO v_is_admin;

    -- Get leave request details
    SELECT status, user_id INTO v_leave_status, v_leave_requester_id
    FROM public.leaves
    WHERE id = p_leave_id;

    -- Permission check: Only the designated approver or an admin can approve/reject
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF v_current_user_id != p_approver AND NOT v_is_admin THEN
        RAISE EXCEPTION 'User does not have permission to approve/reject this leave request.';
    END IF;

    -- Validate action
    IF p_action NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid action. Must be ''approved'' or ''rejected''.';
    END IF;

    -- Update leave status
    UPDATE public.leaves
    SET status = p_action
    WHERE id = p_leave_id;

    -- Log the activity
    INSERT INTO public.user_activity_logs (user_id, activity_type, description, details)
    VALUES (v_leave_requester_id, 'leave_status_updated', 'Your leave request (ID: ' || p_leave_id || ') has been ' || p_action || ' by ' || v_current_user_id || '.', jsonb_build_object('leave_id', p_leave_id, 'action', p_action, 'approver_id', v_current_user_id));

END;
$$;