-- RunHouse RLS Phase 3: 마스터/참조/로그 데이터 10개 테이블
--
-- crews / crew_locations / crew_grades / crew_exercise_types / crew_invite_codes
--   → 크루 단위 데이터. 멤버 SELECT, 어드민 변경.
-- exercise_types / grades
--   → 글로벌 참조 테이블. authenticated SELECT 공개. 변경은 service_role 만.
-- grade_promotion_logs / invite_code_usage_logs / push_history
--   → 시스템 로그. 본인/어드민 SELECT, INSERT 는 SECURITY DEFINER 또는 service_role.

BEGIN;

-- ────────────────────────────────────────────
-- crews
-- ────────────────────────────────────────────
ALTER TABLE attendance.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crews_authenticated_select"
    ON attendance.crews FOR SELECT TO authenticated USING (true);

CREATE POLICY "crews_admin_update"
    ON attendance.crews FOR UPDATE TO authenticated
    USING (attendance.is_master() OR attendance.is_crew_admin(id))
    WITH CHECK (attendance.is_master() OR attendance.is_crew_admin(id));

CREATE POLICY "crews_master_insert"
    ON attendance.crews FOR INSERT TO authenticated
    WITH CHECK (attendance.is_master());

CREATE POLICY "crews_master_delete"
    ON attendance.crews FOR DELETE TO authenticated
    USING (attendance.is_master());

-- ────────────────────────────────────────────
-- crew_locations
-- ────────────────────────────────────────────
ALTER TABLE attendance.crew_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_locations_member_select"
    ON attendance.crew_locations FOR SELECT TO authenticated
    USING (attendance.is_crew_member(crew_id));

CREATE POLICY "crew_locations_admin_insert"
    ON attendance.crew_locations FOR INSERT TO authenticated
    WITH CHECK (attendance.is_crew_admin(crew_id));

CREATE POLICY "crew_locations_admin_update"
    ON attendance.crew_locations FOR UPDATE TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));

CREATE POLICY "crew_locations_admin_delete"
    ON attendance.crew_locations FOR DELETE TO authenticated
    USING (attendance.is_crew_admin(crew_id));

-- ────────────────────────────────────────────
-- crew_grades
-- ────────────────────────────────────────────
ALTER TABLE attendance.crew_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_grades_member_select"
    ON attendance.crew_grades FOR SELECT TO authenticated
    USING (attendance.is_crew_member(crew_id));

CREATE POLICY "crew_grades_admin_modify"
    ON attendance.crew_grades FOR ALL TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));

-- ────────────────────────────────────────────
-- crew_exercise_types
-- ────────────────────────────────────────────
ALTER TABLE attendance.crew_exercise_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_exercise_types_member_select"
    ON attendance.crew_exercise_types FOR SELECT TO authenticated
    USING (attendance.is_crew_member(crew_id));

CREATE POLICY "crew_exercise_types_admin_modify"
    ON attendance.crew_exercise_types FOR ALL TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));

-- ────────────────────────────────────────────
-- crew_invite_codes
-- 가입 검증 흐름(signup/verify-crew/crew-auth)에서 인증된 사용자가
-- invite_code 일치 여부를 직접 SELECT 한다. 이를 허용하기 위해
-- authenticated 에 SELECT 공개. 코드 자체는 random string 이라 enumerate
-- 비용이 높지만, 후속 보강은 SECURITY DEFINER RPC 로 옮길 것을 권장.
-- ────────────────────────────────────────────
ALTER TABLE attendance.crew_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_invite_codes_authenticated_select"
    ON attendance.crew_invite_codes FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "crew_invite_codes_admin_modify"
    ON attendance.crew_invite_codes FOR ALL TO authenticated
    USING (attendance.is_crew_admin(crew_id) OR attendance.is_master())
    WITH CHECK (attendance.is_crew_admin(crew_id) OR attendance.is_master());

-- ────────────────────────────────────────────
-- exercise_types (글로벌 참조)
-- ────────────────────────────────────────────
ALTER TABLE attendance.exercise_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_types_authenticated_select"
    ON attendance.exercise_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "exercise_types_master_modify"
    ON attendance.exercise_types FOR ALL TO authenticated
    USING (attendance.is_master())
    WITH CHECK (attendance.is_master());

-- ────────────────────────────────────────────
-- grades (글로벌 참조)
-- ────────────────────────────────────────────
ALTER TABLE attendance.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grades_authenticated_select"
    ON attendance.grades FOR SELECT TO authenticated USING (true);

CREATE POLICY "grades_master_modify"
    ON attendance.grades FOR ALL TO authenticated
    USING (attendance.is_master())
    WITH CHECK (attendance.is_master());

-- ────────────────────────────────────────────
-- grade_promotion_logs
-- ────────────────────────────────────────────
ALTER TABLE attendance.grade_promotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grade_promotion_logs_self_or_admin_select"
    ON attendance.grade_promotion_logs FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

-- INSERT/UPDATE/DELETE 정책 0 = service_role 또는 SECURITY DEFINER 트리거 만

-- ────────────────────────────────────────────
-- invite_code_usage_logs
-- 가입 흐름(verify-crew/crew-auth)에서 본인이 자기 사용 기록 INSERT.
-- ────────────────────────────────────────────
ALTER TABLE attendance.invite_code_usage_logs ENABLE ROW LEVEL SECURITY;

-- crew_id 가 없으므로 crew_invite_codes 테이블과 JOIN 으로 admin 검증
CREATE POLICY "invite_code_usage_logs_self_or_admin_select"
    ON attendance.invite_code_usage_logs FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_master()
        OR EXISTS (
            SELECT 1 FROM attendance.crew_invite_codes c
            WHERE c.id = invite_code_usage_logs.invite_code_id
              AND attendance.is_crew_admin(c.crew_id)
        )
    );

CREATE POLICY "invite_code_usage_logs_self_insert"
    ON attendance.invite_code_usage_logs FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────
-- push_history
-- 발송 기록은 service_role 이 INSERT, 어드민이 SELECT.
-- ────────────────────────────────────────────
ALTER TABLE attendance.push_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_history_admin_select"
    ON attendance.push_history FOR SELECT TO authenticated
    USING (attendance.is_crew_admin(crew_id) OR attendance.is_master());

-- INSERT/UPDATE/DELETE 정책 0 = service_role 만

COMMIT;
