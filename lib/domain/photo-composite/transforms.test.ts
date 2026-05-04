import { describe, it, expect } from "vitest";
import { 다운스케일치수계산, 클램프적용하기 } from "./transforms";

describe("다운스케일치수계산", () => {
    it("long-edge가 한도 이하면 원본 유지", () => {
        const r = 다운스케일치수계산({ width: 1200, height: 800 }, 1600);
        expect(r).toEqual({ width: 1200, height: 800 });
    });

    it("가로 사진은 width 기준 축소, 비율 유지", () => {
        const r = 다운스케일치수계산({ width: 4000, height: 3000 }, 1600);
        expect(r).toEqual({ width: 1600, height: 1200 });
    });

    it("세로 사진은 height 기준 축소, 비율 유지", () => {
        const r = 다운스케일치수계산({ width: 3000, height: 4000 }, 1600);
        expect(r).toEqual({ width: 1200, height: 1600 });
    });

    it("정사각 사진은 양변 동일 축소", () => {
        const r = 다운스케일치수계산({ width: 3200, height: 3200 }, 1600);
        expect(r).toEqual({ width: 1600, height: 1600 });
    });

    it("결과 치수는 정수 (Math.round)", () => {
        const r = 다운스케일치수계산({ width: 4001, height: 3000 }, 1600);
        expect(Number.isInteger(r.width)).toBe(true);
        expect(Number.isInteger(r.height)).toBe(true);
    });
});

describe("클램프적용하기", () => {
    const photo = { width: 1000, height: 800 };

    it("로고가 사진 안에 있으면 변경 없음", () => {
        const t = { x: 100, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        expect(r.x).toBe(100);
        expect(r.y).toBe(100);
    });

    it("로고가 좌측 경계 밖이면 x를 음수 한도로 클램프", () => {
        // width=200, minVisibleRatio=0.5 → 최대 100px 빠질 수 있음
        const t = { x: -150, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        expect(r.x).toBe(-100); // 50% 이상 보이도록
    });

    it("로고가 우측 경계 밖이면 우측 한도로 클램프", () => {
        const t = { x: 950, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        // 사진 width=1000, 로고 right=x+width, 50% 이상 보여야 → x ≤ 1000 - 100 = 900
        expect(r.x).toBe(900);
    });

    it("aspect ratio로 height 계산해 상하 클램프", () => {
        // width 200, aspectRatio 1.0 → height 200, photo.height=800
        const t = { x: 100, y: 750, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        // 50% 이상 보여야 → y ≤ 800 - 100 = 700
        expect(r.y).toBe(700);
    });
});
