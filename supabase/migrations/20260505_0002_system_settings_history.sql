-- attendance.system_settings_history: system_settings 값 변경 이력 (감사 로그).
-- UPDATE 트리거가 자동으로 row를 추가한다 (INSERT/DELETE는 기록하지 않음).

CREATE TABLE attendance.system_settings_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text NOT NULL,
    old_value   jsonb,
    new_value   jsonb,
    updated_by  uuid REFERENCES attendance.users(id),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_settings_history_key
    ON attendance.system_settings_history(key, updated_at DESC);

ALTER TABLE attendance.system_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_history_master_select
    ON attendance.system_settings_history FOR SELECT TO authenticated
    USING (attendance.is_master());

-- 트리거 함수: 변경 시 히스토리 자동 기록
CREATE OR REPLACE FUNCTION attendance.log_system_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
BEGIN
    IF NEW.value IS DISTINCT FROM OLD.value THEN
        INSERT INTO attendance.system_settings_history
            (key, old_value, new_value, updated_by)
        VALUES (NEW.key, OLD.value, NEW.value, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_system_settings_history
    AFTER UPDATE ON attendance.system_settings
    FOR EACH ROW EXECUTE FUNCTION attendance.log_system_settings_change();
