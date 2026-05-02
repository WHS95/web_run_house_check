import { describe, it, expect } from "vitest";
import {
    유효한_공지타입,
    공지타입_정규화,
    ilike_쿼리_escape,
    유효한_푸시대상모드,
    공지_푸시_타이틀,
    공지_푸시_본문,
} from "./policies";

describe("유효한_공지타입", () => {
    it("허용 값(공지/일반/중요) → true", () => {
        expect(유효한_공지타입("공지")).toBe(true);
        expect(유효한_공지타입("일반")).toBe(true);
        expect(유효한_공지타입("중요")).toBe(true);
    });

    it("허용 외 문자열/타입 → false", () => {
        expect(유효한_공지타입("notice")).toBe(false);
        expect(유효한_공지타입("")).toBe(false);
        expect(유효한_공지타입(undefined)).toBe(false);
        expect(유효한_공지타입(null)).toBe(false);
        expect(유효한_공지타입(123)).toBe(false);
    });
});

describe("공지타입_정규화", () => {
    it("유효 입력은 그대로", () => {
        expect(공지타입_정규화("공지")).toBe("공지");
        expect(공지타입_정규화("중요")).toBe("중요");
    });

    it("유효하지 않으면 '일반'으로 폴백", () => {
        expect(공지타입_정규화(undefined)).toBe("일반");
        expect(공지타입_정규화("주요")).toBe("일반");
        expect(공지타입_정규화(null)).toBe("일반");
    });
});

describe("ilike_쿼리_escape", () => {
    it("% 와 , 는 백슬래시로 escape", () => {
        expect(ilike_쿼리_escape("100%")).toBe("100\\%");
        expect(ilike_쿼리_escape("a,b")).toBe("a\\,b");
        expect(ilike_쿼리_escape("a,b%c")).toBe("a\\,b\\%c");
    });

    it("일반 문자열은 그대로", () => {
        expect(ilike_쿼리_escape("hello world")).toBe("hello world");
        expect(ilike_쿼리_escape("")).toBe("");
    });
});

describe("유효한_푸시대상모드", () => {
    it("'all'/'select'만 허용", () => {
        expect(유효한_푸시대상모드("all")).toBe(true);
        expect(유효한_푸시대상모드("select")).toBe(true);
    });

    it("그 외는 거부", () => {
        expect(유효한_푸시대상모드("ALL")).toBe(false);
        expect(유효한_푸시대상모드(undefined)).toBe(false);
        expect(유효한_푸시대상모드("")).toBe(false);
        expect(유효한_푸시대상모드(null)).toBe(false);
    });
});

describe("공지_푸시_타이틀", () => {
    it("title 있으면 '[타입] 제목'", () => {
        expect(
            공지_푸시_타이틀({
                title: "주말 모임 안내",
                type: "공지",
                content: "어쩌고저쩌고 본문",
            })
        ).toBe("[공지] 주말 모임 안내");
    });

    it("title 없으면 본문 30자 슬라이스", () => {
        const long = "가".repeat(50);
        expect(
            공지_푸시_타이틀({
                title: null,
                type: "중요",
                content: long,
            })
        ).toBe(`[중요] ${"가".repeat(30)}`);
    });

    it("type이 null이면 '일반' 폴백", () => {
        expect(
            공지_푸시_타이틀({
                title: "헬로",
                type: null,
                content: "본문",
            })
        ).toBe("[일반] 헬로");
    });

    it("title이 빈 문자열/공백이면 본문 사용", () => {
        expect(
            공지_푸시_타이틀({
                title: "   ",
                type: "공지",
                content: "백업제목",
            })
        ).toBe("[공지] 백업제목");
    });
});

describe("공지_푸시_본문", () => {
    it("100자 이하 그대로", () => {
        expect(공지_푸시_본문("짧은 본문")).toBe("짧은 본문");
    });

    it("100자 초과는 슬라이스", () => {
        const long = "가".repeat(150);
        expect(공지_푸시_본문(long)).toBe("가".repeat(100));
    });
});
