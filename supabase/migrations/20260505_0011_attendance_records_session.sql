-- attendance.attendance_records: 감지 기반 출석 시스템 컬럼 확장.
-- - session_id: 어떤 세션에 귀속되었는지 (자동 클러스터링 결과)
-- - captured_lat/lng: 출석 시점 디바이스 좌표 (RPC가 클러스터링용으로 사용)
-- - status: 출석 record 상태 — pending/confirmed/rejected/manual
--   기본값 'confirmed' 로 기존 데이터 호환.

ALTER TABLE attendance.attendance_records
    ADD COLUMN IF NOT EXISTS session_id uuid NULL
        REFERENCES attendance.sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS captured_lat  double precision NULL,
    ADD COLUMN IF NOT EXISTS captured_lng  double precision NULL,
    ADD COLUMN IF NOT EXISTS status text NOT NULL
        CHECK (status IN ('pending','confirmed','rejected','manual'))
        DEFAULT 'confirmed';

-- 세션 상세 페이지에서 세션별 record 목록 조회용
CREATE INDEX IF NOT EXISTS idx_attendance_records_session
    ON attendance.attendance_records(session_id);

-- 크루별 시간 역순 조회 (헬스 대시보드 일별 집계용)
CREATE INDEX IF NOT EXISTS idx_attendance_records_crew_captured
    ON attendance.attendance_records(crew_id, attendance_timestamp DESC);
