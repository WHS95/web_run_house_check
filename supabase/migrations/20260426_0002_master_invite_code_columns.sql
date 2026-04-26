-- 첫 가입자 자동 매니저 승격을 위한 컬럼 추가
ALTER TABLE attendance.crew_invite_codes
  ADD COLUMN IF NOT EXISTS is_first_admin_code BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consumed_by UUID NULL
    REFERENCES attendance.users(id) ON DELETE SET NULL;

-- consumed_by가 NULL인 미소비 first-admin 코드 빠른 조회
CREATE INDEX IF NOT EXISTS idx_crew_invite_codes_first_admin_unconsumed
  ON attendance.crew_invite_codes (invite_code)
  WHERE is_first_admin_code = TRUE AND consumed_by IS NULL;

COMMENT ON COLUMN attendance.crew_invite_codes.is_first_admin_code IS
  '이 코드의 첫 가입자에게 CREW_MANAGER 권한을 부여할지 여부';
COMMENT ON COLUMN attendance.crew_invite_codes.consumed_by IS
  'is_first_admin_code 코드를 이미 소비한 user_id (1회용)';
