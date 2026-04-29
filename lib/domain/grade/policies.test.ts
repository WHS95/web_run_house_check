import { describe, it, expect } from "vitest";
import {
    필드_DB컬럼_매핑,
    crew_grade_업데이트_페이로드_빌드,
    등급명_정규화,
} from "./policies";

describe("필드_DB컬럼_매핑", () => {
    it("매핑된 camelCase는 snake_case로 변환", () => {
        expect(필드_DB컬럼_매핑("nameOverride")).toBe("name_override");
        expect(필드_DB컬럼_매핑("minAttendanceCount")).toBe(
            "min_attendance_count"
        );
        expect(필드_DB컬럼_매핑("isActive")).toBe("is_active");
    });

    it("매핑되지 않은 키는 null", () => {
        expect(필드_DB컬럼_매핑("unknownField")).toBeNull();
        expect(필드_DB컬럼_매핑("crewId")).toBeNull();
    });
});

describe("crew_grade_업데이트_페이로드_빌드", () => {
    it("매핑된 필드만 골라 snake_case 페이로드 생성", () => {
        const payload = crew_grade_업데이트_페이로드_빌드({
            nameOverride: "Bronze",
            minAttendanceCount: 5,
            unknownField: "ignored",
        });
        expect(payload).toEqual({
            name_override: "Bronze",
            min_attendance_count: 5,
        });
    });

    it("빈 입력은 빈 객체", () => {
        expect(crew_grade_업데이트_페이로드_빌드({})).toEqual({});
    });

    it("매핑 없는 필드만 들어오면 빈 객체 (PATCH에서 400 처리 트리거)", () => {
        expect(
            crew_grade_업데이트_페이로드_빌드({ foo: 1, bar: 2 })
        ).toEqual({});
    });
});

describe("등급명_정규화", () => {
    it("단일 객체 → name", () => {
        expect(등급명_정규화({ name: "Bronze" })).toBe("Bronze");
    });

    it("배열 → 첫 요소의 name", () => {
        expect(등급명_정규화([{ name: "Silver" }])).toBe("Silver");
    });

    it("null/undefined/빈 배열 → null", () => {
        expect(등급명_정규화(null)).toBeNull();
        expect(등급명_정규화(undefined)).toBeNull();
        expect(등급명_정규화([])).toBeNull();
    });
});
