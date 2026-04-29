import { describe, it, expect } from "vitest";
import * as 정책 from "./policies";

describe("admin 출석 정책", () => {
    describe("recordId_유효한가", () => {
        it("정상 UUID는 통과", () => {
            expect(
                정책.recordId_유효한가(
                    "11111111-1111-1111-1111-111111111111"
                )
            ).toBe(true);
        });

        it("대문자 hex도 통과", () => {
            expect(
                정책.recordId_유효한가(
                    "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE"
                )
            ).toBe(true);
        });

        it("UUID가 아니면 거부", () => {
            expect(정책.recordId_유효한가("not-a-uuid")).toBe(false);
        });

        it("빈 문자열 거부", () => {
            expect(정책.recordId_유효한가("")).toBe(false);
        });

        it("undefined/null 거부", () => {
            expect(정책.recordId_유효한가(undefined)).toBe(false);
            expect(정책.recordId_유효한가(null)).toBe(false);
        });

        it("number 거부", () => {
            expect(정책.recordId_유효한가(123)).toBe(false);
        });
    });

    describe("날짜형식_유효한가", () => {
        it("YYYY-MM-DD 형식 통과", () => {
            expect(정책.날짜형식_유효한가("2026-04-28")).toBe(true);
        });

        it("월/일 자릿수 미달 거부", () => {
            expect(정책.날짜형식_유효한가("2026-4-1")).toBe(false);
        });

        it("ISO datetime 거부", () => {
            expect(
                정책.날짜형식_유효한가("2026-04-28T12:00:00Z")
            ).toBe(false);
        });

        it("빈 문자열/타입 다름 거부", () => {
            expect(정책.날짜형식_유효한가("")).toBe(false);
            expect(정책.날짜형식_유효한가(20260428)).toBe(false);
            expect(정책.날짜형식_유효한가(null)).toBe(false);
        });
    });

    describe("쿼리타입_정규화", () => {
        it("'stats' 그대로", () => {
            expect(정책.쿼리타입_정규화("stats")).toBe("stats");
        });

        it("'calendar' 그대로", () => {
            expect(정책.쿼리타입_정규화("calendar")).toBe("calendar");
        });

        it("미지정/빈 문자열은 calendar로 폴백", () => {
            expect(정책.쿼리타입_정규화(null)).toBe("calendar");
            expect(정책.쿼리타입_정규화(undefined)).toBe("calendar");
            expect(정책.쿼리타입_정규화("")).toBe("calendar");
        });

        it("알 수 없는 값은 null", () => {
            expect(정책.쿼리타입_정규화("unknown")).toBe(null);
            expect(정책.쿼리타입_정규화(123)).toBe(null);
        });
    });

    describe("허용필드_필터", () => {
        it("허용된 필드만 통과", () => {
            const out = 정책.허용필드_필터({
                checkInTime: "2026-04-28T12:00:00Z",
                location: "한강",
                isHost: true,
                rogue: "x",
                user_id: "abc",
            });
            expect(out).toEqual({
                checkInTime: "2026-04-28T12:00:00Z",
                location: "한강",
                isHost: true,
            });
        });

        it("부분 입력 OK", () => {
            expect(정책.허용필드_필터({ isHost: false })).toEqual({
                isHost: false,
            });
        });

        it("isHost 타입 잘못되면 무시", () => {
            expect(
                정책.허용필드_필터({ isHost: "yes" as unknown as boolean })
            ).toEqual({});
        });

        it("location/checkInTime 타입 잘못되면 무시", () => {
            expect(
                정책.허용필드_필터({
                    location: 1 as unknown as string,
                    checkInTime: 2 as unknown as string,
                })
            ).toEqual({});
        });

        it("null/undefined/비-객체는 빈 객체", () => {
            expect(정책.허용필드_필터(null)).toEqual({});
            expect(정책.허용필드_필터(undefined)).toEqual({});
            expect(정책.허용필드_필터({} as Record<string, unknown>)).toEqual(
                {}
            );
        });
    });

    describe("bulk_입력_유효한가", () => {
        const valid = {
            crewId: "00000000-0000-0000-0000-000000000001",
            users: [
                { userId: "uid-1", isHost: true },
                { userId: "uid-2", isHost: false },
            ],
            attendanceTimestamp: "2026-04-28T12:00:00.000Z",
            locationId: "5",
            exerciseTypeId: "1",
        };

        it("정상 입력 통과", () => {
            expect(정책.bulk_입력_유효한가(valid)).toBe(true);
        });

        it("crewId 없음 거부", () => {
            expect(
                정책.bulk_입력_유효한가({ ...valid, crewId: "" })
            ).toBe(false);
        });

        it("users 빈 배열 거부", () => {
            expect(
                정책.bulk_입력_유효한가({ ...valid, users: [] })
            ).toBe(false);
        });

        it("users 항목 isHost 누락 거부", () => {
            expect(
                정책.bulk_입력_유효한가({
                    ...valid,
                    users: [{ userId: "u" } as unknown as { userId: string; isHost: boolean }],
                })
            ).toBe(false);
        });

        it("users 항목 userId 타입 거부", () => {
            expect(
                정책.bulk_입력_유효한가({
                    ...valid,
                    users: [
                        {
                            userId: 1 as unknown as string,
                            isHost: false,
                        },
                    ],
                })
            ).toBe(false);
        });

        it("attendanceTimestamp 누락 거부", () => {
            expect(
                정책.bulk_입력_유효한가({
                    ...valid,
                    attendanceTimestamp: "",
                })
            ).toBe(false);
        });

        it("locationId/exerciseTypeId 누락 거부", () => {
            expect(
                정책.bulk_입력_유효한가({ ...valid, locationId: "" })
            ).toBe(false);
            expect(
                정책.bulk_입력_유효한가({ ...valid, exerciseTypeId: "" })
            ).toBe(false);
        });

        it("null/undefined 거부", () => {
            expect(정책.bulk_입력_유효한가(null)).toBe(false);
            expect(정책.bulk_입력_유효한가(undefined)).toBe(false);
        });
    });

    describe("exerciseTypeId_정규화", () => {
        it("정상 숫자/문자열 → number", () => {
            expect(정책.exerciseTypeId_정규화("1")).toBe(1);
            expect(정책.exerciseTypeId_정규화(2)).toBe(2);
        });

        it("NaN 입력 → null", () => {
            expect(정책.exerciseTypeId_정규화("abc")).toBe(null);
        });

        it("null/undefined/빈 문자열 → null", () => {
            expect(정책.exerciseTypeId_정규화(null)).toBe(null);
            expect(정책.exerciseTypeId_정규화(undefined)).toBe(null);
            expect(정책.exerciseTypeId_정규화("")).toBe(null);
        });
    });

    describe("locationId_정규화", () => {
        it("정상 숫자/문자열 → number", () => {
            expect(정책.locationId_정규화("5")).toBe(5);
            expect(정책.locationId_정규화(7)).toBe(7);
        });

        it("NaN/빈/null → null", () => {
            expect(정책.locationId_정규화("xx")).toBe(null);
            expect(정책.locationId_정규화(null)).toBe(null);
            expect(정책.locationId_정규화("")).toBe(null);
        });
    });
});
