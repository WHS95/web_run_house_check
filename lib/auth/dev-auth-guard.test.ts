import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isDevAuthEnabled } from "./dev-auth-guard";

describe("isDevAuthEnabled", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });
    afterEach(() => {
        process.env = originalEnv;
    });

    const setNodeEnv = (val: string) => {
        Object.defineProperty(process.env, "NODE_ENV", {
            value: val,
            configurable: true,
        });
    };

    it("프로덕션에서는 플래그 true여도 false를 반환한다", () => {
        setNodeEnv("production");
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH = "true";
        expect(isDevAuthEnabled()).toBe(false);
    });

    it("development + 플래그 true이면 true", () => {
        setNodeEnv("development");
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH = "true";
        expect(isDevAuthEnabled()).toBe(true);
    });

    it("development + 플래그 미설정이면 false", () => {
        setNodeEnv("development");
        delete process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH;
        expect(isDevAuthEnabled()).toBe(false);
    });

    it("development + 플래그 'false' 문자열이면 false", () => {
        setNodeEnv("development");
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH = "false";
        expect(isDevAuthEnabled()).toBe(false);
    });
});
