import { describe, it, expect } from "vitest";
import {
    정확도범위_유효한가,
    정확도범위_최솟값,
    정확도범위_최댓값,
    isAdmin_to_crew_role,
    crew_role_to_role_id,
    본인_조작_시도인가,
} from "./policies";

describe("crew 정책", () => {
    describe("정확도범위_유효한가", () => {
        it("최솟값(50) → true", () => {
            expect(정확도범위_유효한가(정확도범위_최솟값)).toBe(true);
        });
        it("최댓값(500) → true", () => {
            expect(정확도범위_유효한가(정확도범위_최댓값)).toBe(true);
        });
        it("범위 내 200 → true", () => {
            expect(정확도범위_유효한가(200)).toBe(true);
        });
        it("최솟값 미만(49) → false", () => {
            expect(정확도범위_유효한가(49)).toBe(false);
        });
        it("최댓값 초과(501) → false", () => {
            expect(정확도범위_유효한가(501)).toBe(false);
        });
        it("문자열 입력 → false", () => {
            expect(정확도범위_유효한가("200")).toBe(false);
        });
        it("undefined → false", () => {
            expect(정확도범위_유효한가(undefined)).toBe(false);
        });
        it("NaN → false", () => {
            expect(정확도범위_유효한가(NaN)).toBe(false);
        });
    });

    describe("isAdmin_to_crew_role", () => {
        it("true → CREW_MANAGER", () => {
            expect(isAdmin_to_crew_role(true)).toBe("CREW_MANAGER");
        });
        it("false → MEMBER", () => {
            expect(isAdmin_to_crew_role(false)).toBe("MEMBER");
        });
    });

    describe("crew_role_to_role_id", () => {
        it("CREW_MANAGER → 2", () => {
            expect(crew_role_to_role_id("CREW_MANAGER")).toBe(2);
        });
        it("MEMBER → 3", () => {
            expect(crew_role_to_role_id("MEMBER")).toBe(3);
        });
        it("OWNER 등 기타 → 3", () => {
            expect(crew_role_to_role_id("OWNER")).toBe(3);
        });
        it("null/undefined → 3", () => {
            expect(crew_role_to_role_id(null)).toBe(3);
            expect(crew_role_to_role_id(undefined)).toBe(3);
        });
    });

    describe("본인_조작_시도인가", () => {
        it("동일 ID → true", () => {
            expect(본인_조작_시도인가("user-1", "user-1")).toBe(true);
        });
        it("다른 ID → false", () => {
            expect(본인_조작_시도인가("user-1", "user-2")).toBe(false);
        });
    });
});
