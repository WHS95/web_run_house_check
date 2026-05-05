-- attendance.system_settings: 마스터 관리자가 운영하는 시스템 전역 튜닝 값
-- 감지 기반 출석 시스템에서 클러스터링/세션 종료/라벨 추천 임계값을
-- 코드 배포 없이 운영자가 조정할 수 있게 하는 단일 진실 소스(Source of Truth).

-- 재실행 안전(idempotent). updated_by FK는 운영자 계정 삭제 시 NULL로
-- 끊어 row가 살아남도록 ON DELETE SET NULL.
CREATE TABLE IF NOT EXISTS attendance.system_settings (
    key         text PRIMARY KEY,
    value       jsonb NOT NULL,
    description text,
    updated_by  uuid REFERENCES attendance.users(id) ON DELETE SET NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 초기 값 (재실행 시 기존 키는 유지)
INSERT INTO attendance.system_settings(key, value, description) VALUES
    ('session_window_minutes',       '15',  '클러스터링 시간 임계값 (분)'),
    ('session_radius_m',             '100', '클러스터링 거리 임계값 (m)'),
    ('session_close_minutes',        '60',  '세션 자동 종료 시간 (분)'),
    ('auto_label_min_session_count', '5',   '라벨 자동 추천 최소 세션 수')
ON CONFLICT (key) DO NOTHING;

-- RLS: 마스터만 읽기/쓰기 가능
-- (출석 처리 RPC는 SECURITY DEFINER 함수를 통해 RLS를 우회한다)
ALTER TABLE attendance.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_settings_master_select
    ON attendance.system_settings;
CREATE POLICY system_settings_master_select ON attendance.system_settings
    FOR SELECT TO authenticated
    USING (attendance.is_master());

DROP POLICY IF EXISTS system_settings_master_modify
    ON attendance.system_settings;
CREATE POLICY system_settings_master_modify ON attendance.system_settings
    FOR ALL TO authenticated
    USING (attendance.is_master())
    WITH CHECK (attendance.is_master());

-- 서버에서 출석 처리 시 RLS 우회로 read 가능하게 하는 헬퍼.
-- RPC들이 settings 값에 접근할 때 일관된 진입점.
CREATE OR REPLACE FUNCTION attendance.get_system_setting(p_key text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
    SELECT value FROM attendance.system_settings WHERE key = p_key;
$$;

REVOKE ALL ON FUNCTION attendance.get_system_setting(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_system_setting(text)
    TO authenticated, anon;
