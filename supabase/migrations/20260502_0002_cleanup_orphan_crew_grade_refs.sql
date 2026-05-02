-- ============================================================================
-- 의도: 비활성/존재하지 않는 crew_grades 를 가리키는 user_crews.crew_grade_id 정리
-- ----------------------------------------------------------------------------
-- 배경 (GAP #9):
--   app/admin2/settings/grade/actions.ts 의 deactivateCrewGradeAction 은 등급
--   삭제 시 attendance.crew_grades.is_active = false 로 soft delete 만 수행하고,
--   이미 그 grade 를 들고 있던 attendance.user_crews.crew_grade_id 는 그대로
--   남겨둔다. 결과적으로 "비활성 등급을 가리키는 orphan reference" 가 발생함.
--
--   FK (user_crews_crew_grade_id_fkey) 는 ON DELETE SET NULL 이지만, 이는 hard
--   delete 에만 동작한다. soft delete (is_active=false) 케이스는 보호되지 않으므로
--   본 마이그레이션에서 일괄 NULL 처리한다.
--
-- 멱등성 (idempotent):
--   동일 SQL 을 여러 번 실행해도 부수효과가 없다. 이미 NULL 이거나 활성 등급을
--   가리키는 row 는 WHERE 절에서 걸러진다.
--
-- 후속 작업 (이번 마이그레이션 범위 밖):
--   - deactivateCrewGradeAction 에서 user_crews.crew_grade_id 동시 NULL 처리
--     (application-layer; BFF 룰 + lib/domain 정책 함수 도입 권장)
--   - 트리거는 BFF 룰과 충돌하므로 비권장
--
-- 실행 일자: 2026-05-02
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_affected_rows INTEGER := 0;
    v_inactive_refs INTEGER := 0;
    v_truly_orphan_refs INTEGER := 0;
BEGIN
    -- 사전 카운트: 비활성 grade 를 가리키는 row 수
    SELECT COUNT(*)
      INTO v_inactive_refs
      FROM attendance.user_crews uc
     WHERE uc.crew_grade_id IS NOT NULL
       AND uc.crew_grade_id IN (
           SELECT id FROM attendance.crew_grades WHERE is_active = false
       );

    -- 사전 카운트: crew_grades 자체에 존재하지 않는 (ON DELETE SET NULL 이
    -- 무언가의 이유로 동작하지 않은) truly orphan reference
    SELECT COUNT(*)
      INTO v_truly_orphan_refs
      FROM attendance.user_crews uc
     WHERE uc.crew_grade_id IS NOT NULL
       AND uc.crew_grade_id NOT IN (
           SELECT id FROM attendance.crew_grades
       );

    RAISE NOTICE '[cleanup_orphan_crew_grade_refs] before: inactive_refs=%, truly_orphan_refs=%',
        v_inactive_refs, v_truly_orphan_refs;

    -- 본 작업: 두 케이스 (비활성 + truly orphan) 를 한 번에 NULL 처리
    UPDATE attendance.user_crews uc
       SET crew_grade_id = NULL
     WHERE uc.crew_grade_id IS NOT NULL
       AND (
           uc.crew_grade_id NOT IN (SELECT id FROM attendance.crew_grades)
           OR uc.crew_grade_id IN (
               SELECT id FROM attendance.crew_grades WHERE is_active = false
           )
       );

    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

    RAISE NOTICE '[cleanup_orphan_crew_grade_refs] updated rows: %', v_affected_rows;

    -- 사후 검증: 동일 조건으로 남은 row 가 0 이어야 함
    PERFORM 1
       FROM attendance.user_crews uc
      WHERE uc.crew_grade_id IS NOT NULL
        AND (
            uc.crew_grade_id NOT IN (SELECT id FROM attendance.crew_grades)
            OR uc.crew_grade_id IN (
                SELECT id FROM attendance.crew_grades WHERE is_active = false
            )
        )
      LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION '[cleanup_orphan_crew_grade_refs] post-check failed: orphan references still exist';
    END IF;

    RAISE NOTICE '[cleanup_orphan_crew_grade_refs] post-check OK';
END $$;

COMMIT;
