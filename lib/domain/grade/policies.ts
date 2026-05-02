/**
 * 등급 도메인 룰.
 * /api/admin/grades 라우트에 흩어져 있던 비-DB 비즈니스 로직을 모은다.
 */

/**
 * crew_grades 테이블에서 PATCH 시 허용되는 필드.
 * camelCase 입력 → snake_case DB 컬럼 매핑.
 *
 * 주의: 매핑 표에 없는 키는 허용하지 않는다. PATCH route에서도 `fieldMap[key]`가
 * undefined인 경우 update 대상에서 제외했다.
 */
const CREW_GRADE_FIELD_MAP: Record<string, string> = {
    nameOverride: "name_override",
    descriptionOverride: "description_override",
    minAttendanceCount: "min_attendance_count",
    minHostingCount: "min_hosting_count",
    promotionPeriodType: "promotion_period_type",
    sortOrder: "sort_order",
    canHost: "can_host",
    isActive: "is_active",
};

/**
 * camelCase 필드명을 crew_grades DB 컬럼명으로 변환한다.
 * 매핑되지 않은 필드는 null을 반환해 호출부에서 무시할 수 있게 한다.
 */
export function 필드_DB컬럼_매핑(field: string): string | null {
    return CREW_GRADE_FIELD_MAP[field] ?? null;
}

/**
 * 클라이언트가 보낸 PATCH 본문에서 허용된 필드만 골라
 * snake_case DB 업데이트 페이로드를 만든다.
 *
 * 라우트에서 사용하던 패턴을 도메인으로 추출했다.
 * 빈 객체가 반환되면 업데이트 대상이 없는 것으로 처리해야 한다.
 */
export function crew_grade_업데이트_페이로드_빌드(
    fields: Record<string, unknown>
): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
        const column = 필드_DB컬럼_매핑(key);
        if (column) {
            updateData[column] = value;
        }
    }
    return updateData;
}

/**
 * Supabase의 `grades:grade_id (name)` 조인 결과를 단일 name 문자열로 정규화.
 * Supabase 타입 추론이 배열/객체를 모두 허용하므로 도메인에서 통일한다.
 */
export function 등급명_정규화(
    grades: { name: string } | { name: string }[] | null | undefined
): string | null {
    if (!grades) return null;
    if (Array.isArray(grades)) {
        return grades[0]?.name ?? null;
    }
    return grades.name ?? null;
}
