import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        await import("./sentry.edge.config");
    }
}

// 서버 컴포넌트·미들웨어에서 던진 에러를 Sentry로 포워딩
export const onRequestError = Sentry.captureRequestError;
