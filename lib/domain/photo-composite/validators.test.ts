import { describe, it, expect } from "vitest";
import { 사진업로드_검증, 로고업로드_검증 } from "./validators";

function makeFile(name: string, type: string, size: number): File {
    return new File([new Uint8Array(size)], name, { type });
}

describe("사진업로드_검증", () => {
    it("image/jpeg 5MB는 허용", () => {
        const r = 사진업로드_검증(makeFile("a.jpg", "image/jpeg", 5_000_000));
        expect(r.ok).toBe(true);
    });

    it("image/png 5MB는 허용", () => {
        const r = 사진업로드_검증(makeFile("a.png", "image/png", 5_000_000));
        expect(r.ok).toBe(true);
    });

    it("image/heic는 거부", () => {
        const r = 사진업로드_검증(makeFile("a.heic", "image/heic", 5_000_000));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toMatch(/HEIC|지원/);
    });

    it("20MB 초과는 거부", () => {
        const r = 사진업로드_검증(
            makeFile("a.jpg", "image/jpeg", 21_000_000),
        );
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toMatch(/20MB|크기/);
    });

    it("이미지 아닌 파일 거부", () => {
        const r = 사진업로드_검증(makeFile("a.txt", "text/plain", 100));
        expect(r.ok).toBe(false);
    });
});

describe("로고업로드_검증", () => {
    it("image/png는 허용", () => {
        const r = 로고업로드_검증(makeFile("logo.png", "image/png", 200_000));
        expect(r.ok).toBe(true);
    });

    it("image/jpeg는 거부 (PNG만 허용 — 투명도 보장)", () => {
        const r = 로고업로드_검증(
            makeFile("logo.jpg", "image/jpeg", 200_000),
        );
        expect(r.ok).toBe(false);
    });

    it("5MB 초과는 거부", () => {
        const r = 로고업로드_검증(makeFile("l.png", "image/png", 6_000_000));
        expect(r.ok).toBe(false);
    });
});
