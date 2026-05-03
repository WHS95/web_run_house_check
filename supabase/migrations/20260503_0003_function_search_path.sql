-- RunHouse RLS Phase 0: 18개 함수의 search_path 미설정 advisor WARN 해소.
-- 각 함수에 SET search_path = attendance, public, pg_temp 적용.
-- ALTER FUNCTION 은 idempotent (반복 적용 안전).

BEGIN;

ALTER FUNCTION attendance.calculate_grade_recommendations(p_crew_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.find_user_by_username(p_username text)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_admin_stats(
    p_crew_id uuid, p_year integer, p_month integer
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_admin_users_unified(p_crew_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_attendance_form_data(p_user_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_attendance_ranking(
    target_crew_id uuid, target_year integer, target_month integer,
    current_user_id uuid
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_current_month_stats(p_user_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_home_page_data(p_user_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_hosting_ranking(
    target_crew_id uuid, target_year integer, target_month integer,
    current_user_id uuid
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_mypage_data_unified(p_user_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_ranking_data(
    p_crew_id uuid,
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone,
    p_current_user_id uuid
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_ranking_data_unified(
    p_user_id uuid, target_year integer, target_month integer
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_recent_active_meet(p_user_id uuid, p_crew_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_specific_month_stats(
    p_user_id uuid, p_year integer, p_month integer
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_user_activity_statistics(
    p_user_id uuid, p_time_period text
) SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_user_permissions(p_user_id uuid)
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.trigger_set_timestamp()
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.update_invite_code_usage()
    SET search_path = attendance, public, pg_temp;

ALTER FUNCTION attendance.get_admin_users_with_period(
    p_crew_id uuid,
    p_from timestamp with time zone,
    p_to timestamp with time zone
) SET search_path = attendance, public, pg_temp;

COMMIT;
