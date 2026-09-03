import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,

    // 요청 IP/헤더 포함 (프로덕션에서는 법적 이슈 확인 후 사용)
    sendDefaultPii: false,

    // 트랜잭션 샘플링 — 개발 100%, 프로덕션 10%
    tracesSampleRate:
        process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // ⚠️ replayIntegration 을 여기에 정적으로 넣지 말 것.
    // Session Replay 는 gzip +38.7 kB 이고 **모든 라우트의 공용 청크**로 들어간다.
    // 실제 녹화는 세션의 10% 뿐인데 100% 가 다운로드하던 상태였다.
    // 아래에서 유휴 시점에 지연 로드한다.
    integrations: [Sentry.browserTracingIntegration()],

    // 세션 리플레이 — 일반 세션 10%, 에러 세션 100%
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // DSN 없을 때 또는 dev 모드에서 조용히 비활성화
    enabled:
        !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
        process.env.NODE_ENV !== "development",
});

// Session Replay 지연 로드 — 첫 페인트를 막지 않는다.
if (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
    process.env.NODE_ENV !== "development"
) {
    const 유휴실행 =
        "requestIdleCallback" in window
            ? window.requestIdleCallback
            : (cb: () => void) => window.setTimeout(cb, 2000);

    유휴실행(() => {
        Sentry.lazyLoadIntegration("replayIntegration")
            .then((replayIntegration) => {
                Sentry.addIntegration(
                    replayIntegration({
                        maskAllText: true,
                        maskAllInputs: true,
                        blockAllMedia: true,
                    })
                );
            })
            .catch(() => {
                /* 네트워크 실패 시 리플레이 없이 계속한다 */
            });
    });
}
