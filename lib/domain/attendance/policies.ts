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
