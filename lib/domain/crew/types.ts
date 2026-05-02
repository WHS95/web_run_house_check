/**
 * 크루(crew) 도메인 타입.
 * /api/admin/settings, /api/admin/crew-settings/location-attendance,
 * /api/admin/crew-members 라우트에서 사용하던 표현을 도메인 레이어로 옮긴다.
 */

/**
 * crews 테이블에서 settings 조회 시 select하는 컬럼 (getCrewById 결과).
 */
export interface CrewSettingsRow {
    id: string;
    name: string;
    description: string | null;
    location_based_attendance: boolean | null;
    accuracy_range?: number | null;
    allow_unregistered_location?: boolean | null;
    created_at: string;
    updated_at: string | null;
}

/**
 * 크루 운동 종류 행 (getCrewExerciseTypes 결과).
 */
export interface CrewExerciseTypeRow {
    id: number;
    name: string;
}

/**
 * /api/admin/settings GET 응답 data 형태.
 */
export interface CrewSettingsBundle {
    crewData: CrewSettingsRow;
    locations: unknown[];
    exerciseTypes: CrewExerciseTypeRow[];
}

/**
 * crew_role 값을 받는 데이터베이스 enum 표현.
 */
export type CrewRole = "OWNER" | "CREW_MANAGER" | "MEMBER";

/**
 * 멤버 목록 응답 (api/admin/crew-members GET 결과 정규화 형태).
 */
export interface CrewMemberRow {
    id: string;
    first_name: string | null;
    email: string | null;
    phone: string | null;
    birth_year: number | null;
    profile_image_url: string | null;
    is_crew_verified: boolean | null;
    created_at: string;
    role_id: number;
    crew_role: CrewRole | string;
}
