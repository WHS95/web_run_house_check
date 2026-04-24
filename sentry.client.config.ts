import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,

    // 요청 IP/헤더 포함 (프로덕션에서는 법적 이슈 확인 후 사용)
    sendDefaultPii: false,

    // 트랜잭션 샘플링 — 개발 100%, 프로덕션 10%
    tracesSampleRate:
        process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
        }),
    ],

    // 세션 리플레이 — 일반 세션 10%, 에러 세션 100%
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // DSN 없을 때 또는 dev 모드에서 조용히 비활성화
    enabled:
        !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
        process.env.NODE_ENV !== "development",
});
