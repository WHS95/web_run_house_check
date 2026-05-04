import { describe, it, expect } from "vitest";
import { 프리셋좌표산출 } from "./presets";

const PHOTO = { width: 1600, height: 1200 };
const MARGIN = 32;

describe("프리셋좌표산출", () => {
    it("M 사이즈는 long-edge × 0.12 너비", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(192); // 1600 * 0.12
    });

    it("S 사이즈는 long-edge × 0.08", () => {
        const r = 프리셋좌표산출("top-left", "S", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(128);
    });

    it("L 사이즈는 long-edge × 0.18", () => {
        const r = 프리셋좌표산출("top-left", "L", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(288);
    });

    it("top-left 위치는 (margin, margin)", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.x).toBe(MARGIN);
        expect(r.y).toBe(MARGIN);
    });

    it("top-right 위치는 사진 우측에 margin 띄움", () => {
        const r = 프리셋좌표산출("top-right", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        expect(r.y).toBe(MARGIN);
    });

    it("center는 사진 중앙", () => {
        const r = 프리셋좌표산출("center", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo((1600 - 192) / 2);
        expect(r.y).toBeCloseTo((1200 - 192) / 2);
    });

    it("bottom-left", () => {
        const r = 프리셋좌표산출("bottom-left", "M", PHOTO, 1.0);
        expect(r.x).toBe(MARGIN);
        expect(r.y).toBeCloseTo(1200 - MARGIN - 192);
    });

    it("bottom-right", () => {
        const r = 프리셋좌표산출("bottom-right", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        expect(r.y).toBeCloseTo(1200 - MARGIN - 192);
    });

    it("회전 0, 투명도 1 기본", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.rotation).toBe(0);
        expect(r.opacity).toBe(1);
    });

    it("세로 사진은 short-edge가 아닌 long-edge(=height) 기준", () => {
        const portrait = { width: 1200, height: 1600 };
        const r = 프리셋좌표산출("top-left", "M", portrait, 1.0);
        expect(r.width).toBeCloseTo(192); // 1600 * 0.12
    });

    it("로고 비율이 다르면 height는 width/aspectRatio (배치는 width 기준)", () => {
        const r = 프리셋좌표산출("top-right", "M", PHOTO, 2.0);
        const height = 192 / 2.0; // 96
        // top-right이라 x는 width 기준만 봄
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        // bottom-right은 height도 봐야 함 → 별도 테스트
        const br = 프리셋좌표산출("bottom-right", "M", PHOTO, 2.0);
        expect(br.y).toBeCloseTo(1200 - MARGIN - height);
    });
});
