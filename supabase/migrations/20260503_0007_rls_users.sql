-- RunHouse RLS Phase 1d: attendance.users
--
-- 정책 요지
--   - SELECT: 본인 OR 같은 크루 어드민(verified_crew_id 기준) OR 글로벌 master
--   - INSERT: 본인 row (id = auth.uid()) — signup/OAuth callback 흐름 통과
--   - UPDATE-self  : 본인 row 만
--   - UPDATE-admin : 같은 크루 어드민이 다른 멤버의 verified_crew_id 갱신
--                    (예: admin2/settings/members 추방 시)
--                    또는 master 가 모든 사용자 수정
--   - DELETE 정책 0 = deny → 탈퇴는 SECURITY DEFINER `withdraw_user` RPC 만
--
-- 영향 분석 (audit-supabase-client-access 결과 기반)
--   - lib/access/user-context, app/page, app/attendance/actions, app/mypage/*
--     → 본인 SELECT/UPDATE → self 정책 통과
--   - app/auth/signup/actions, app/auth/callback/route → 본인 upsert
--     → users_self_insert / users_self_update 통과
--   - app/auth/verify-crew/* → 본인 SELECT/UPDATE → self 통과
--   - lib/admin2/queries → 같은 크루 멤버 조회 → admin SELECT 통과
--   - app/admin2/settings/members/actions → 다른 사용자 verified_crew_id 갱신
--     → admin UPDATE 통과
--   - lib/admin2/* (auth/api-guard/action-auth) → 본인 SELECT (권한 검증) → self 통과
--   - lib/supabase/admin (service_role) → RLS 우회
--
-- Phase 4 후속: 컬럼 단위 GRANT 화이트리스트로 status/suspended_*/oauth_* 등
-- admin/시스템 전용 컬럼을 본인 UPDATE 경로에서 차단할 예정.

BEGIN;

ALTER TABLE attendance.users ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 OR 본 크루 어드민 OR master
CREATE POLICY "users_self_or_admin_select"
    ON attendance.users
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR attendance.is_master()
        OR (
            verified_crew_id IS NOT NULL
            AND attendance.is_crew_admin(verified_crew_id)
        )
    );

-- INSERT: 본인 row 만 (signup / OAuth callback)
CREATE POLICY "users_self_insert"
    ON attendance.users
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- UPDATE-self: 본인 row 수정
CREATE POLICY "users_self_update"
    ON attendance.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- UPDATE-admin: 같은 크루 어드민이 다른 멤버 수정 (예: 추방 시 verified_crew_id null 처리)
CREATE POLICY "users_admin_update"
    ON attendance.users
    FOR UPDATE
    TO authenticated
    USING (
        attendance.is_master()
        OR (
            verified_crew_id IS NOT NULL
            AND attendance.is_crew_admin(verified_crew_id)
        )
    )
    WITH CHECK (
        attendance.is_master()
        OR (
            verified_crew_id IS NOT NULL
            AND attendance.is_crew_admin(verified_crew_id)
        )
        OR id = auth.uid()  -- admin 이 본인 처리하는 경우 self_update 와 동등 처리
    );

COMMIT;
