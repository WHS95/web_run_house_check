const KST_TZ = 'Asia/Seoul';
const ALLOW_AHEAD_MS = 2 * 60 * 60 * 1000;

/**
 * KST 기준 현재 + 2시간 이내인지 검사.
 * 현재 시각을 KST로 변환한 뒤 ALLOW_AHEAD_MS만큼 더한 값과 비교.
 */
export function 유효한가(현재: Date, 출석시각: string): boolean {
    const koreaTime = new Date(
        현재.toLocaleString('en-US', { timeZone: KST_TZ })
    );
    const max = new Date(koreaTime.getTime() + ALLOW_AHEAD_MS);
    return new Date(출석시각) <= max;
}

/**
 * 크루의 미등록 장소 출석 허용 여부.
 */
export function 미등록허용(
    crew: { allow_unregistered_location: boolean }
): boolean {
    return crew.allow_unregistered_location === true;
}

/**
 * 크루의 위치 기반 출석 정책 — locationId='unregistered' 사용 가능 여부.
 * - location_based_attendance=true (위치 기반 ON): 'unregistered'는 별도 allow_unregistered_location 따름
 * - location_based_attendance=false (OFF): 'unregistered' 자유 허용
 *
 * 단순화: 현재 비즈니스 의도는 "어드민이 위치기반 출석을 켰을 때만 위치 검증을 강제한다"
 * 위치기반 OFF 인 크루에선 클라이언트가 위치 모달을 거치지 않으므로 unregistered로 간주.
 */
export function 위치기반_출석필요한가(
    crew: { location_based_attendance: boolean }
): boolean {
    return crew.location_based_attendance === true;
}

const ACTIVE_LIKE = new Set(['ACTIVE', null, undefined, '']);

/**
 * 사용자가 출석 가능한 상태인가?
 * users.status / user_crews.status 조합으로 판정.
 *
 * 둘 중 하나라도 SUSPENDED/INACTIVE/WITHDRAWN이면 차단.
 * (대소문자 무관 비교)
 *
 * 현재 admin 토글이 user_crews.status를 ACTIVE↔SUSPENDED로 갱신하므로
 * 기본 케이스는 user_crews.status 검증. users.status는 추가 안전망.
 *
 * @deprecated `lib/domain/access/policies.ts`의 `출석등록_가능한가`로 이전됨.
 *             신규 호출자는 access 모듈을 사용. 본 함수는 다음 chunk에서 제거.
 */
export function 출석가능상태인가(input: {
    userStatus?: string | null;
    userCrewStatus?: string | null;
}): boolean {
    return 활성_상태인가(input.userStatus) && 활성_상태인가(input.userCrewStatus);
}

function 활성_상태인가(raw: string | null | undefined): boolean {
    if (raw === null || raw === undefined || raw === '') return true;
    const upper = raw.toUpperCase();
    if (ACTIVE_LIKE.has(upper)) return true;
    return upper === 'ACTIVE';
}
