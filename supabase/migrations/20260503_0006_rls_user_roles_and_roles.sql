-- RunHouse RLS Phase 1c: attendance.user_roles + attendance.roles
--
-- 정책 요지
--   - user_roles: 본인 행만 SELECT. INSERT/UPDATE/DELETE 정책 0 = deny.
--                 master role 부여/회수는 service_role 또는 SECURITY DEFINER RPC.
--   - roles: authenticated 에게 SELECT 공개 (참조 테이블, 이름만 있음).
--            INSERT/UPDATE/DELETE 정책 0 = deny.
--
-- 영향 분석
--   모든 .from('user_roles') 호출이 .eq('user_id', user.id) 패턴 → self_select 통과.
--   roles 는 master/actions, master/invite-codes 에서 nested select(roles(name)) 호출 → public select 통과.

BEGIN;

ALTER TABLE attendance.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_self_select"
    ON attendance.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "roles_authenticated_select"
    ON attendance.roles
    FOR SELECT
    TO authenticated
    USING (true);

COMMIT;
