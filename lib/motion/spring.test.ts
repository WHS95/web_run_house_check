import { describe, it, expect } from "vitest";
import * as 스프링 from "./spring";

describe("스프링 파라미터", () => {
    describe("스프링설정", () => {
        it("감쇠비 1.0은 임계감쇠 — damping² = 4·stiffness", () => {
            const s = 스프링.스프링설정({ dampingRatio: 1.0, response: 0.35 });
            expect(s.damping ** 2).toBeCloseTo(4 * s.stiffness * s.mass, 6);
        });

        it("감쇠비 0.8은 부족감쇠 — 오버슛한다", () => {
            const s = 스프링.스프링설정({ dampingRatio: 0.8, response: 0.3 });
            expect(s.damping ** 2).toBeLessThan(4 * s.stiffness * s.mass);
        });

        it("응답시간이 짧을수록 stiffness가 커진다", () => {
            const 느림 = 스프링.스프링설정({ dampingRatio: 1, response: 0.6 });
            const 빠름 = 스프링.스프링설정({ dampingRatio: 1, response: 0.2 });
            expect(빠름.stiffness).toBeGreaterThan(느림.stiffness);
        });

        it("type은 항상 spring", () => {
            expect(스프링.스프링설정(스프링.기본_스프링).type).toBe("spring");
        });

        it("속도를 넘기지 않으면 velocity 키가 없다", () => {
            const s = 스프링.스프링설정(스프링.기본_스프링);
            expect(s.velocity).toBeUndefined();
        });

        it("속도를 넘기면 그대로 인계한다", () => {
            const s = 스프링.스프링설정(스프링.시트_스프링, 1234);
            expect(s.velocity).toBe(1234);
        });

        it("속도 0도 명시적으로 인계한다 (undefined와 구분)", () => {
            const s = 스프링.스프링설정(스프링.시트_스프링, 0);
            expect(s.velocity).toBe(0);
        });

        it("음수 속도(위로 던짐)도 인계한다", () => {
            const s = 스프링.스프링설정(스프링.시트_스프링, -800);
            expect(s.velocity).toBe(-800);
        });

        it("ω_n = 2π/response 를 따른다", () => {
            const response = 0.5;
            const omega = (2 * Math.PI) / response;
            const s = 스프링.스프링설정({ dampingRatio: 1, response });
            expect(s.stiffness).toBeCloseTo(omega * omega, 6);
        });
    });

    describe("프리셋", () => {
        it("기본 스프링은 오버슛이 없다", () => {
            expect(스프링.기본_스프링.dampingRatio).toBe(1.0);
        });

        it("시트 스프링은 Apple 드로어 스펙(0.8 / 0.3)이다", () => {
            expect(스프링.시트_스프링.dampingRatio).toBe(0.8);
            expect(스프링.시트_스프링.response).toBe(0.3);
        });

        it("이동 스프링은 오버슛 없이 조금 느리다", () => {
            expect(스프링.이동_스프링.dampingRatio).toBe(1.0);
            expect(스프링.이동_스프링.response).toBeGreaterThan(
                스프링.시트_스프링.response
            );
        });

        it("감속 스프링은 가장 빠르게 정착한다", () => {
            expect(스프링.감속_스프링.response).toBeLessThan(
                스프링.기본_스프링.response
            );
        });
    });

    describe("모션설정_선택", () => {
        it("일반 상태면 원래 스펙을 쓴다", () => {
            expect(스프링.모션설정_선택(스프링.시트_스프링, false)).toBe(
                스프링.시트_스프링
            );
        });

        it("모션 최소화면 오버슛 없는 스펙으로 바꾼다", () => {
            const s = 스프링.모션설정_선택(스프링.시트_스프링, true);
            expect(s).toBe(스프링.감속_스프링);
            expect(s.dampingRatio).toBe(1.0);
        });
    });
});
