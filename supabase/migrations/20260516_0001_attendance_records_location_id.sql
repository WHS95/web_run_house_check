-- attendance.attendance_records: location_id 컬럼 추가.
-- register_attendance_v2 RPC 가 INSERT 하려는 컬럼이지만
-- 기존 마이그레이션 시퀀스에서 컬럼 추가 단계가 누락되어 있어
-- 출석 등록 시 42703(column does not exist) 에러가 발생함.
-- 미등록 장소 출석은 NULL 허용. crew_locations 삭제 시 SET NULL.

ALTER TABLE attendance.attendance_records
    ADD COLUMN IF NOT EXISTS location_id int NULL
        REFERENCES attendance.crew_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_records_location_id
    ON attendance.attendance_records(location_id);
