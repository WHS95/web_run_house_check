-- 감지 기반 출석 시스템 — 세션 + 세션 멤버 테이블.
-- 출석은 시점에 자동 클러스터링되어 sessions에 귀속된다.
-- session_members는 어떤 출석 record가 어떤 세션에 속하는지의 매핑.

CREATE TABLE attendance.sessions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id      uuid NOT NULL
        REFERENCES attendance.crews(id) ON DELETE CASCADE,
    started_at   timestamptz NOT NULL,
    ended_at     timestamptz NULL,
    center_lat   double precision NOT NULL,
    center_lng   double precision NOT NULL,
    radius_m     int NOT NULL,
    auto_label   text NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- 크루별 시간 역순 조회 (목록 페이지 기본 인덱스)
CREATE INDEX idx_sessions_crew_started
    ON attendance.sessions(crew_id, started_at DESC);
-- 활성(미종료) 세션 빠르게 찾기 (클러스터링 후보 조회)
CREATE INDEX idx_sessions_open
    ON attendance.sessions(crew_id) WHERE ended_at IS NULL;

CREATE TABLE attendance.session_members (
    session_id           uuid NOT NULL
        REFERENCES attendance.sessions(id) ON DELETE CASCADE,
    user_id              uuid NOT NULL
        REFERENCES attendance.users(id),
    attendance_record_id uuid NOT NULL,
    joined_at            timestamptz NOT NULL,
    PRIMARY KEY (session_id, user_id)
);

CREATE INDEX idx_session_members_user
    ON attendance.session_members(user_id);

-- RLS: 자기 크루의 세션/멤버만 조회 가능
ALTER TABLE attendance.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_member_select ON attendance.sessions
    FOR SELECT TO authenticated
    USING (
        attendance.is_crew_member(crew_id)
        OR attendance.is_master()
    );

CREATE POLICY session_members_select ON attendance.session_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM attendance.sessions s
            WHERE s.id = session_id
              AND (
                  attendance.is_crew_member(s.crew_id)
                  OR attendance.is_master()
              )
        )
    );

-- 운영진(CREW_MANAGER 또는 master)만 직접 수정 가능 — 보정 화면용.
-- 일반 출석 등록은 SECURITY DEFINER RPC가 처리하므로 RLS 우회.
CREATE POLICY sessions_admin_modify ON attendance.sessions
    FOR ALL TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));

CREATE POLICY session_members_admin_modify ON attendance.session_members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM attendance.sessions s
            WHERE s.id = session_id
              AND attendance.is_crew_admin(s.crew_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM attendance.sessions s
            WHERE s.id = session_id
              AND attendance.is_crew_admin(s.crew_id)
        )
    );
