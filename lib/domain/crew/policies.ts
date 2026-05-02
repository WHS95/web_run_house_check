/**
 * 크루 설정(crew settings) 도메인 정책.
 *
 * /api/admin/crew-settings/location-attendance,
 * /api/admin/crew-members 라우트의 비-DB 비즈니스 규칙을 모은다.
 */

import type { CrewRole } from "./types";

/**
 * 위치 정확도 허용 범위 (미터).
 * 기존 라우트의 50~500m 검증을 도메인으로 이관.
 */
export const 정확도범위_최솟값 = 50;
export const 정확도범위_최댓값 = 500;

/**
 * accuracy_range 가 50~500m 범위 안인지 검사한다.
 * 기존 /api/admin/crew-settings/location-attendance 의 validation과 동일.
 */
export function 정확도범위_유효한가(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 정확도범위_최솟값 &&
        value <= 정확도범위_최댓값
    );
}

/**
 * isAdmin 플래그(boolean) → DB 저장용 crew_role 값 매핑.
 *
 * 기존 /api/admin/crew-members PATCH 의
 * `isAdmin ? "CREW_MANAGER" : "MEMBER"` 매핑을 도메인으로 추출.
 */
export function isAdmin_to_crew_role(
    isAdmin: boolean
): Extract<CrewRole, "CREW_MANAGER" | "MEMBER"> {
    return isAdmin ? "CREW_MANAGER" : "MEMBER";
}

/**
 * crew_role → role_id (UI/Validator 호환) 매핑.
 *
 * 기존 /api/admin/crew-members GET 의
 * `crew_role === "CREW_MANAGER" ? 2 : 3` 와 동일.
 */
export function crew_role_to_role_id(
    crew_role: string | null | undefined
): number {
    return crew_role === "CREW_MANAGER" ? 2 : 3;
}

/**
 * 본인이 본인을 변경/추방하려는지 검사.
 * /api/admin/crew-members 의 자기 자신 권한 변경/추방 차단 로직.
 */
export function 본인_조작_시도인가(
    targetUserId: string,
    actorUserId: string
): boolean {
    return targetUserId === actorUserId;
}
