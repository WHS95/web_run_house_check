-- RunHouse RLS Phase 1a: attendance.user_push_tokens
--
-- 정책 요지
--   - 본인 토큰: 본인이 ALL (SELECT/INSERT/UPDATE/DELETE)
--   - 크루 어드민: SELECT 만 (admin2/push 의 송신 대상 조회용)
--   - 그 외: deny
--   - service_role: 자동 우회 (lib/push/send-notification.ts 의 일괄 발송)
--
-- 영향 분석 (audit-supabase-client-access.ts 결과 기반)
--   - app/mypage/actions.ts (server, 본인) ✓ self_all 통과
--   - app/admin2/push/actions.ts (server, admin → 다른 사용자 SELECT)
--       ✓ crew_admin_select 통과 (CREW_MANAGER 또는 master)
--   - lib/push/send-notification.ts (service_role) ✓ 정책 우회

BEGIN;

ALTER TABLE attendance.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- 본인이 자신의 토큰을 전부 관리
CREATE POLICY "user_push_tokens_self_all"
    ON attendance.user_push_tokens
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 같은 크루의 어드민(CREW_MANAGER) 또는 글로벌 master 는 SELECT 가능
CREATE POLICY "user_push_tokens_crew_admin_select"
    ON attendance.user_push_tokens
    FOR SELECT
    TO authenticated
    USING (attendance.is_crew_admin(crew_id));

COMMIT;
