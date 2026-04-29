/**
 * Admin 출석 관리 도메인 타입.
 *
 * /api/admin/attendance, /api/admin/attendance/bulk,
 * /api/admin/attendance/daily, /api/admin/attendance/delete,
 * /api/admin/attendance/update 라우트에서 흩어진 입력/응답 타입을
 * 한 곳에 모은다.
 */

/**
 * /api/admin/attendance GET ?type 파라미터 종류.
 *
 * - stats: 대시보드 통계용 데이터
 * - calendar: 출석 관리 달력용 (year, month 필수)
 *
 * 라우트의 기본값은 calendar.
 */
export type AdminAttendanceQueryType = "stats" | "calendar";

/**
 * /api/admin/attendance/bulk POST 본문의 단일 사용자 항목.
 */
export interface BulkAttendanceUserInput {
    userId: string;
    isHost: boolean;
}

/**
 * /api/admin/attendance/bulk POST 본문 전체.
 *
 * 라우트에서 검증하던 파라미터를 도메인 입력 스키마로 정리한다.
 */
export interface BulkAttendanceInput {
    crewId: string;
    users: BulkAttendanceUserInput[];
    attendanceTimestamp: string;
    locationId: string | number;
    exerciseTypeId: string | number;
}

/**
 * /api/admin/attendance/update PUT 본문의 updates 객체.
 *
 * 화이트리스트(checkInTime/location/isHost) 외 필드는 도메인에서 제거된다.
 */
export interface AdminAttendanceUpdateInput {
    checkInTime?: string;
    location?: string;
    isHost?: boolean;
}

/**
 * Server Action에서 응답하는 일괄 출석 결과.
 *
 * 기존 라우트 응답 호환을 위해 createdCount + createdRecords를 보존한다.
 */
export interface BulkAttendanceCreateResult {
    createdCount: number;
    createdRecords: Array<{ id: string; user_id: string }>;
}
