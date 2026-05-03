-- RunHouse RLS Phase 5: 회귀 방지용 RLS 상태 조회 RPC
--
-- check-rls.ts 가 호출. service_role 로만 사용. authenticated/anon 은 호출 불가.

CREATE OR REPLACE FUNCTION attendance.__check_rls_status__()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT
        c.relname::text,
        c.relrowsecurity,
        COALESCE(p.cnt, 0)::int
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN (
        SELECT tablename, COUNT(*)::int AS cnt
        FROM pg_policies
        WHERE schemaname = 'attendance'
        GROUP BY tablename
    ) p ON p.tablename = c.relname
    WHERE n.nspname = 'attendance' AND c.relkind = 'r'
    ORDER BY c.relname;
$$;

COMMENT ON FUNCTION attendance.__check_rls_status__() IS
    'CI 회귀 방지용 — attendance 스키마 테이블 RLS 상태 일괄 조회. service_role 로만 호출.';

-- service_role 만 실행 가능하게 GRANT
REVOKE ALL ON FUNCTION attendance.__check_rls_status__() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION attendance.__check_rls_status__() TO service_role;
