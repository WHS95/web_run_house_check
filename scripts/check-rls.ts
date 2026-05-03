/**
 * scripts/check-rls.ts
 *
 * 회귀 방지 CI 게이트: `attendance` 스키마의 모든 테이블에 RLS 가
 * ENABLE 되어 있는지 검사. 새 테이블 추가 시 RLS 누락을 빌드 타임에 차단.
 *
 * Phase 0 시점: 모든 테이블 RLS OFF 화이트리스트 등록.
 *               Phase 1~3 동안 화이트리스트에서 한 줄씩 빠짐.
 *               Phase 5 에서 화이트리스트 비어있을 때 본격 검증 활성화.
 *
 * 본 검사가 직접 pg_class 를 조회해야 하므로 service_role 키 + 별도
 * RPC `attendance.__rls_status__()` 가 필요. Phase 5 에서 RPC 추가 + 본 스크립트
 * 실제 검증 로직 구현 예정.
 */

const RLS_OFF_ALLOWED: ReadonlySet<string> = new Set([
    "users",
    "user_crews",
    "user_roles",
    "roles",
    "attendance_records",
    "user_push_tokens",
    "password_reset_tokens",
    "notifications",
    "notices",
    "push_history",
    "crews",
    "crew_invite_codes",
    "crew_locations",
    "crew_grades",
    "crew_exercise_types",
    "exercise_types",
    "grades",
    "grade_promotion_logs",
    "invite_code_usage_logs",
]);

console.log(
    `[check-rls] Phase 5 에서 본 검사 활성화. 현재 화이트리스트 ${RLS_OFF_ALLOWED.size} 개 (Phase 1~3 으로 감소).`
);
