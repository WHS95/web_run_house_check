-- 감지 기반 출석 시스템 — 운영진 세션 보정 감사 로그
-- Phase 3 Task 3.1
-- 운영진이 세션 멤버를 추가/제거/라벨변경/세션삭제 할 때 모든 변경 사항을
-- 추적해 누가/언제/무엇을 했는지 사후 검증할 수 있게 한다.

BEGIN;

CREATE TABLE IF NOT EXISTS attendance.session_audit_log (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     uuid NULL REFERENCES attendance.sessions(id) ON DELETE SET NULL,
    crew_id        uuid NOT NULL REFERENCES attendance.crews(id) ON DELETE CASCADE,
    admin_id       uuid NOT NULL REFERENCES attendance.users(id),
    action         text NOT NULL CHECK (
        action IN ('add', 'remove', 'relabel', 'delete_session')
    ),
    target_user_id uuid NULL REFERENCES attendance.users(id),
    before_state   jsonb,
    after_state    jsonb,
    created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE attendance.session_audit_log IS
    '운영진의 세션 보정 작업 감사 로그. 멤버 추가/제거/라벨변경/세션삭제 추적.';
COMMENT ON COLUMN attendance.session_audit_log.action IS
    'add: 멤버 추가, remove: 멤버 제거, relabel: 라벨 변경, delete_session: 세션 삭제';
COMMENT ON COLUMN attendance.session_audit_log.target_user_id IS
    'add/remove에만 사용. relabel/delete_session에서는 NULL.';

CREATE INDEX IF NOT EXISTS idx_session_audit_log_session
    ON attendance.session_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_session_audit_log_crew
    ON attendance.session_audit_log(crew_id, created_at DESC);

-- RLS: 자기 크루의 audit log만 조회 가능 (운영진 또는 마스터)
ALTER TABLE attendance.session_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS session_audit_admin_select
    ON attendance.session_audit_log;
CREATE POLICY session_audit_admin_select ON attendance.session_audit_log
    FOR SELECT TO authenticated
    USING (
        attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

-- INSERT는 서버 액션에서만 (SECURITY DEFINER로 우회) 수행하므로 정책 불필요.
-- 단, 직접 INSERT 차단을 위해 명시적 거부 정책은 두지 않음 (RLS 기본 deny).

COMMIT;
