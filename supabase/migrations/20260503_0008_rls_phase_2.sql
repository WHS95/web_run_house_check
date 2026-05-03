-- RunHouse RLS Phase 2: 비즈니스 4개 테이블
--   attendance_records, user_crews, notifications, notices
--
-- 적용 정책 요약
--
-- attendance_records
--   - SELECT: 본 크루 멤버 (랭킹/통계 공유)
--   - INSERT: 본인 + 본 크루 멤버
--   - UPDATE: 본인 OR 크루 어드민 (정정/소프트삭제)
--   - DELETE: 크루 어드민 (실삭제는 admin 만, 일반은 UPDATE deleted_at 권장)
--
-- user_crews
--   - SELECT: 본인 OR 같은 크루 멤버 OR 크루 어드민 OR master
--   - INSERT: 본인 OR 크루 어드민 OR master (signup/멤버 관리/master 가입처리)
--   - UPDATE: 본인 OR 크루 어드민 OR master (grade/status 변경)
--   - DELETE: 크루 어드민 OR master (추방/탈퇴 후처리)
--
-- notifications
--   - SELECT/UPDATE/DELETE: 본인 알림만
--   - INSERT: 정책 0 → service_role 만 (lib/push/send-notification)
--
-- notices
--   - SELECT: active 이고 본 크루 멤버인 경우
--   - INSERT/UPDATE/DELETE: 본 크루 어드민

BEGIN;

-- ────────────────────────────────────────────
-- attendance_records
-- ────────────────────────────────────────────
ALTER TABLE attendance.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_crew_member_select"
    ON attendance.attendance_records
    FOR SELECT
    TO authenticated
    USING (attendance.is_crew_member(crew_id));

CREATE POLICY "attendance_records_self_insert"
    ON attendance.attendance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND attendance.is_crew_member(crew_id)
    );

CREATE POLICY "attendance_records_self_or_admin_update"
    ON attendance.attendance_records
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
    )
    WITH CHECK (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
    );

CREATE POLICY "attendance_records_admin_delete"
    ON attendance.attendance_records
    FOR DELETE
    TO authenticated
    USING (attendance.is_crew_admin(crew_id));

-- ────────────────────────────────────────────
-- user_crews
-- ────────────────────────────────────────────
ALTER TABLE attendance.user_crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_crews_self_or_crew_member_select"
    ON attendance.user_crews
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_crew_member(crew_id)
        OR attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

CREATE POLICY "user_crews_self_or_admin_insert"
    ON attendance.user_crews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

CREATE POLICY "user_crews_self_or_admin_update"
    ON attendance.user_crews
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    )
    WITH CHECK (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

CREATE POLICY "user_crews_admin_delete"
    ON attendance.user_crews
    FOR DELETE
    TO authenticated
    USING (
        attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

-- ────────────────────────────────────────────
-- notifications
-- ────────────────────────────────────────────
ALTER TABLE attendance.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_self_select"
    ON attendance.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_self_update"
    ON attendance.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_self_delete"
    ON attendance.notifications
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- notices
-- ────────────────────────────────────────────
ALTER TABLE attendance.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_crew_member_select"
    ON attendance.notices
    FOR SELECT
    TO authenticated
    USING (attendance.is_crew_member(crew_id));

CREATE POLICY "notices_admin_insert"
    ON attendance.notices
    FOR INSERT
    TO authenticated
    WITH CHECK (attendance.is_crew_admin(crew_id));

CREATE POLICY "notices_admin_update"
    ON attendance.notices
    FOR UPDATE
    TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));

CREATE POLICY "notices_admin_delete"
    ON attendance.notices
    FOR DELETE
    TO authenticated
    USING (attendance.is_crew_admin(crew_id));

COMMIT;
