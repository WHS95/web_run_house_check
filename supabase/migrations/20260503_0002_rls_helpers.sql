-- RunHouse RLS Phase 0: 정책 공통 헬퍼 함수 5종.
-- 모든 함수는 SECURITY DEFINER + search_path 명시 + STABLE 로 작성한다.
-- - SECURITY DEFINER : RLS 가 켜진 후에도 헬퍼 자체가 차단당하지 않게 함
-- - SET search_path  : search_path injection 방지 (Supabase advisor WARN 해소)
-- - STABLE           : 같은 트랜잭션 안에서 결과 캐시 → 정책 평가 비용 절감
-- - GRANT EXECUTE TO authenticated, anon
--    anon 은 auth.uid() 가 NULL 이므로 모든 헬퍼가 자연스럽게 false 반환

BEGIN;

CREATE OR REPLACE FUNCTION attendance.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT auth.uid();
$$;

COMMENT ON FUNCTION attendance.current_user_id() IS
    'auth.uid() 를 그대로 반환하는 편의 헬퍼. 익명일 때 NULL.';

REVOKE ALL ON FUNCTION attendance.current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.current_user_id() TO authenticated, anon;

CREATE OR REPLACE FUNCTION attendance.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

COMMENT ON FUNCTION attendance.is_authenticated() IS
    '현재 요청이 Supabase 인증된 사용자인지 여부.';

REVOKE ALL ON FUNCTION attendance.is_authenticated() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.is_authenticated() TO authenticated, anon;

CREATE OR REPLACE FUNCTION attendance.is_crew_member(p_crew_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM attendance.user_crews uc
        WHERE uc.user_id = auth.uid()
          AND uc.crew_id = p_crew_id
          AND uc.status  = 'ACTIVE'
    );
$$;

COMMENT ON FUNCTION attendance.is_crew_member(uuid) IS
    '현재 사용자가 해당 크루의 ACTIVE 멤버인지. SUSPENDED/INACTIVE/WITHDRAWN 은 false.';

REVOKE ALL ON FUNCTION attendance.is_crew_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.is_crew_member(uuid) TO authenticated, anon;

-- is_master 가 is_crew_admin 에서 호출되므로 먼저 정의한다.
CREATE OR REPLACE FUNCTION attendance.is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM attendance.user_roles ur
        LEFT JOIN attendance.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
          AND (
              r.name = 'master'
              OR ur.role_id = 1
          )
    );
$$;

COMMENT ON FUNCTION attendance.is_master() IS
    '현재 사용자가 글로벌 master(super admin)인지. roles.name=''master'' 또는 role_id=1 둘 다 인정.';

REVOKE ALL ON FUNCTION attendance.is_master() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.is_master() TO authenticated, anon;

CREATE OR REPLACE FUNCTION attendance.is_crew_admin(p_crew_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT
        EXISTS (
            SELECT 1
            FROM attendance.user_crews uc
            WHERE uc.user_id   = auth.uid()
              AND uc.crew_id   = p_crew_id
              AND uc.status    = 'ACTIVE'
              AND uc.crew_role = 'CREW_MANAGER'
        )
        OR attendance.is_master();
$$;

COMMENT ON FUNCTION attendance.is_crew_admin(uuid) IS
    '현재 사용자가 해당 크루의 CREW_MANAGER 인지, 또는 글로벌 master 인지.';

REVOKE ALL ON FUNCTION attendance.is_crew_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.is_crew_admin(uuid) TO authenticated, anon;

COMMIT;
