/**
 * Admin 출석 관리 도메인 정책.
 *
 * /api/admin/attendance, /api/admin/attendance/bulk,
 * /api/admin/attendance/daily, /api/admin/attendance/delete,
 * /api/admin/attendance/update 라우트에 흩어져 있던 비-DB
 * 검증/정규화 로직을 한 곳에 모은다.
 */

import type {
    AdminAttendanceQueryType,
    AdminAttendanceUpdateInput,
    BulkAttendanceInput,
} from "./types";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED_UPDATE_FIELDS: ReadonlyArray<keyof AdminAttendanceUpdateInput> = [
    "checkInTime",
    "location",
    "isHost",
] as const;

const VALID_QUERY_TYPES: ReadonlyArray<AdminAttendanceQueryType> = [
    "stats",
    "calendar",
] as const;

/**
 * 출석 레코드 ID(uuid) 형식 검증.
 *
 * /api/admin/attendance/delete, /api/admin/attendance/update 라우트의
 * inline UUID 정규식 검증을 도메인으로 추출.
 */
export function recordId_유효한가(recordId: unknown): recordId is string {
    return typeof recordId === "string" && UUID_REGEX.test(recordId);
}

/**
 * YYYY-MM-DD 날짜 형식 검증.
 *
 * /api/admin/attendance/daily 라우트의 inline 정규식 검증을
 * 도메인으로 추출. 윤년/실제 존재 여부까지는 검증하지 않는다(라우트 동작 보존).
 */
export function 날짜형식_유효한가(date: unknown): date is string {
    return typeof date === "string" && DATE_REGEX.test(date);
}

/**
 * type 파라미터 정규화.
 *
 * 라우트는 type 미지정 시 calendar를 기본값으로 처리한다.
 * 알 수 없는 값은 null을 반환해 호출자가 400을 응답할 수 있게 한다.
 */
export function 쿼리타입_정규화(
    type: unknown
): AdminAttendanceQueryType | null {
    if (type === null || type === undefined || type === "") {
        return "calendar";
    }
    if (
        typeof type === "string" &&
        VALID_QUERY_TYPES.includes(type as AdminAttendanceQueryType)
    ) {
        return type as AdminAttendanceQueryType;
    }
    return null;
}

/**
 * /api/admin/attendance/update 라우트의 화이트리스트 필터.
 *
 * checkInTime / location / isHost 외의 키는 모두 제거한다.
 * 결과 객체가 비었으면 호출자가 400을 응답한다.
 */
export function 허용필드_필터(
    updates: Record<string, unknown> | null | undefined
): AdminAttendanceUpdateInput {
    if (!updates || typeof updates !== "object") {
        return {};
    }
    const out: AdminAttendanceUpdateInput = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const value = (updates as Record<string, unknown>)[key];
            if (value === undefined) continue;
            if (key === "isHost" && typeof value !== "boolean") continue;
            if (
                (key === "checkInTime" || key === "location") &&
                typeof value !== "string"
            )
                continue;
            (out as Record<string, unknown>)[key] = value;
        }
    }
    return out;
}

/**
 * /api/admin/attendance/bulk POST 본문 검증.
 *
 * users 배열의 모든 항목이 { userId: string, isHost: boolean }을 만족해야
 * 한다. 라우트의 inline `Array.isArray + some(...)` 검증을 도메인으로 추출.
 */
export function bulk_입력_유효한가(
    input: Partial<BulkAttendanceInput> | null | undefined
): input is BulkAttendanceInput {
    if (!input) return false;
    if (typeof input.crewId !== "string" || !input.crewId) return false;
    if (!Array.isArray(input.users) || input.users.length === 0) return false;
    for (const u of input.users) {
        if (
            !u ||
            typeof (u as { userId?: unknown }).userId !== "string" ||
            typeof (u as { isHost?: unknown }).isHost !== "boolean"
        ) {
            return false;
        }
    }
    if (typeof input.attendanceTimestamp !== "string" || !input.attendanceTimestamp)
        return false;
    if (input.locationId === undefined || input.locationId === null || input.locationId === "")
        return false;
    if (
        input.exerciseTypeId === undefined ||
        input.exerciseTypeId === null ||
        input.exerciseTypeId === ""
    )
        return false;
    return true;
}

/**
 * exerciseTypeId 정규화.
 *
 * 라우트는 string/number 모두 허용 후 parseInt로 변환한다.
 * 음수/NaN은 null을 반환해 호출자가 400으로 응답한다.
 */
export function exerciseTypeId_정규화(
    raw: string | number | null | undefined
): number | null {
    if (raw === null || raw === undefined || raw === "") return null;
    const n = parseInt(String(raw), 10);
    if (Number.isNaN(n)) return null;
    return n;
}

/**
 * locationId 정규화 (bulk 라우트에서 parseInt 적용).
 *
 * NaN/음수면 null.
 */
export function locationId_정규화(
    raw: string | number | null | undefined
): number | null {
    if (raw === null || raw === undefined || raw === "") return null;
    const n = parseInt(String(raw), 10);
    if (Number.isNaN(n)) return null;
    return n;
}
