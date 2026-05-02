/**
 * Dev 전용 로그인 백도어가 활성화되어 있는지 검사한다.
 *
 * 두 조건을 동시에 만족해야 true:
 *   1) NODE_ENV !== 'production'
 *   2) NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true'
 *
 * NEXT_PUBLIC_ 프리픽스 덕분에 빌드 시점에 클라이언트 번들로 인라인되어
 * 프로덕션 빌드에선 Dead-code elimination으로 dev 패널을 제거할 수 있다.
 */
export function isDevAuthEnabled(): boolean {
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    return process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "true";
}
