// 사용자 접근 도메인 정책 (순수 함수).
// Supabase / Next / React import 절대 금지.

const ACTIVE_LIKE = new Set(['ACTIVE']);

export interface AccessInput {
    userStatus: string | null;
    userCrewStatus: string | null;
    isCrewVerified: boolean;
}

/**
 * 일반 크루 페이지(/, /attendance, /ranking, /mypage 등) 진입 가능한가?
 *
 * - 크루 인증 안 되어 있으면 false
 * - users.status 또는 user_crews.status 가 비활성
 *   (SUSPENDED/INACTIVE/WITHDRAWN 등)이면 false
 * - null/빈 값은 ACTIVE 취급 (legacy 데이터 호환)
 */
export function 크루멤버_접근가능한가(input: AccessInput): boolean {
    if (!input.isCrewVerified) {
        return false;
    }
    return (
        활성_상태인가(input.userStatus) &&
        활성_상태인가(input.userCrewStatus)
    );
}

/**
 * 출석 등록 가능한 상태인가?
 *
 * 현재는 두 status 가드만 적용하지만, 향후 정책 분기 여지를 위해
 * 크루멤버_접근가능한가의 단순 alias 가 아닌 별도 함수로 유지한다.
 */
export function 출석등록_가능한가(
    input: Omit<AccessInput, 'isCrewVerified'>
): boolean {
    return (
        활성_상태인가(input.userStatus) &&
        활성_상태인가(input.userCrewStatus)
    );
}

/**
 * 단일 status 문자열의 활성 여부.
 * - null/undefined/빈 문자열 → true (legacy 데이터 호환)
 * - 'ACTIVE' (대소문자 무관) → true
 * - 그 외 (SUSPENDED/INACTIVE/WITHDRAWN 등) → false
 */
function 활성_상태인가(raw: string | null | undefined): boolean {
    if (raw === null || raw === undefined || raw === '') {
        return true;
    }
    return ACTIVE_LIKE.has(raw.toUpperCase());
}
