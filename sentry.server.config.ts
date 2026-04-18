import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,

    // 요청 IP/헤더 등 PII — 프로덕션 비활성화
    sendDefaultPii: false,

    // 트랜잭션 샘플링 — 개발 100%, 프로덕션 10%
    tracesSampleRate:
        process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Sentry 로그 전송
    enableLogs: true,

    // DSN 없을 때 조용히 비활성화
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
