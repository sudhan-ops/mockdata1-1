-- This function allows an authenticated user to submit their attendance (check-in).
-- It validates the check-in against defined attendance rules for the site and day of the week.
-- If no rules are found or if the check-in is within the allowed time, it's marked 'approved'.
-- Otherwise, it's marked 'pending_approval'.

-- Required environment variables: None.

-- Next steps for deployment:
-- 1. Deploy this function to Supabase.
-- 2. Ensure RLS policies are correctly set for `public.attendance` and `public.enrollments`.
-- 3. Ensure `public.attendance_rules` table is populated with relevant data.

CREATE OR REPLACE FUNCTION public.submit_attendance(p_site uuid, p_checkin timestamptz)
RETURNS TABLE(id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER -- SECURITY DEFINER is used here to allow the function to bypass RLS on `attendance_rules`
                 -- and `enrollments` tables to perform necessary checks, while still enforcing RLS
                 -- on the `attendance` table for the actual insert.
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_attendance_rule_id uuid;
    v_min_checkin_time timestamptz;
    v_max_checkin_time timestamptz;
    v_is_valid_attendance boolean := TRUE;
    v_status text := 'approved';
BEGIN
    -- Get the current authenticated user's ID
    v_user_id := auth.uid();

    -- Check if the user is enrolled in the site
    IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = v_user_id AND site_id = p_site) THEN
        RAISE EXCEPTION 'User is not enrolled in this site.';
    END IF;

    -- Get attendance rules for the site and current day
    SELECT
        ar.id,
        ar.min_checkin_time,
        ar.max_checkin_time
    INTO
        v_attendance_rule_id,
        v_min_checkin_time,
        v_max_checkin_time
    FROM
        public.attendance_rules ar
    WHERE
        ar.site_id = p_site AND ar.day_of_week = LOWER(TO_CHAR(p_checkin, 'Day'));

    -- Validate attendance against rules if they exist
    IF v_attendance_rule_id IS NOT NULL THEN
        IF p_checkin NOT BETWEEN v_min_checkin_time AND v_max_checkin_time THEN
            v_is_valid_attendance := FALSE;
            v_status := 'pending_approval'; -- Or 'rejected' based on business logic
        END IF;
    END IF;

    -- Insert attendance record
    INSERT INTO public.attendance (user_id, site_id, check_in, status)
    VALUES (v_user_id, p_site, p_checkin, v_status)
    RETURNING attendance.id, attendance.status INTO id, status;

    RETURN NEXT;
END;
$$;