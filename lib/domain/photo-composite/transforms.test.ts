import { describe, it, expect } from "vitest";
import { 다운스케일치수계산 } from "./transforms";

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
