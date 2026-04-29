/**
 * 등급(grade) 도메인 타입.
 * /api/admin/grades, /api/admin/grade-recommendations 라우트에서 사용하던
 * Supabase row 표현을 도메인 레이어로 옮겨놓는다.
 */

/**
 * crew_grades 테이블 행. /api/admin/grades GET의 select 컬럼 + 조인 결과.
 */
export interface CrewGradeRow {
    id: number;
    crew_id: string;
    grade_id: number;
    name_override: string | null;
    description_override: string | null;
    min_attendance_count: number | null;
    min_hosting_count: number | null;
    promotion_period_type: string | null;
    sort_order: number | null;
    can_host: boolean | null;
    is_active: boolean;
    /**
     * `grades:grade_id (name)` 조인 결과.
     * Supabase는 단일 관계도 배열로 표현할 수 있으므로 배열/객체 모두 허용한다.
     */
    grades?: { name: string } | { name: string }[] | null;
}

/**
 * crew_grades 신규 레코드 입력값. POST /api/admin/grades 본문.
 */
export interface CrewGradeCreateInput {
    crewId: string;
    gradeId: number;
    nameOverride?: string | null;
    descriptionOverride?: string | null;
    minAttendanceCount?: number | null;
    minHostingCount?: number | null;
    promotionPeriodType?: string | null;
    sortOrder?: number | null;
    canHost?: boolean | null;
}

/**
 * 등급 추천 RPC `calculate_grade_recommendations` 결과 행.
 */
export interface GradeRecommendationRow {
    user_id: string;
    recommended_grade_id: number;
    [key: string]: unknown;
}

/**
 * grade_promotion_logs 테이블 change_type. 라우트에서 사용된 값.
 */
export type GradePromotionChangeType = "manual" | "approved";
