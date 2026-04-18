import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,

    tracesSampleRate:
        process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // 서버 요청 IP/헤더 포함 여부
    sendDefaultPii: false,

    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
