import { describe, it, expect } from "vitest";
import * as 제스처 from "./gesture";

describe("제스처 물리", () => {
    describe("모멘텀_투사계산", () => {
        it("속도 0이면 추가 이동 없음", () => {
            expect(제스처.모멘텀_투사계산(0)).toBe(0);
        });

        it("양수 속도는 양수 거리로 투사", () => {
            expect(제스처.모멘텀_투사계산(1000)).toBeGreaterThan(0);
        });

        it("음수 속도는 음수 거리로 투사 (위로 던짐)", () => {
            expect(제스처.모멘텀_투사계산(-1000)).toBeLessThan(0);
        });

        it("속도에 선형 비례", () => {
            const a = 제스처.모멘텀_투사계산(500);
            const b = 제스처.모멘텀_투사계산(1000);
            expect(b).toBeCloseTo(a * 2, 6);
        });

        it("기본 감속률 0.998에서 1000px/s는 약 499px 미끄러진다", () => {
            // (1000/1000) * 0.998 / 0.002 = 499
            expect(제스처.모멘텀_투사계산(1000)).toBeCloseTo(499, 6);
        });

        it("감속률이 낮으면 덜 미끄러진다", () => {
            const 느슨 = 제스처.모멘텀_투사계산(1000, 0.998);
            const 빡빡 = 제스처.모멘텀_투사계산(1000, 0.99);
            expect(빡빡).toBeLessThan(느슨);
        });
    });

    describe("러버밴딩_계산", () => {
        it("오버슛 0이면 0", () => {
            expect(제스처.러버밴딩_계산(0, 500)).toBe(0);
        });

        it("항상 원본보다 작게 움직인다 (저항)", () => {
            const r = 제스처.러버밴딩_계산(100, 500);
            expect(Math.abs(r)).toBeLessThan(100);
        });

        it("음수 오버슛도 부호를 유지한다", () => {
            expect(제스처.러버밴딩_계산(-100, 500)).toBeLessThan(0);
        });

        it("많이 끌수록 저항 비율이 커진다", () => {
            const 비율100 = Math.abs(제스처.러버밴딩_계산(100, 500)) / 100;
            const 비율400 = Math.abs(제스처.러버밴딩_계산(400, 500)) / 400;
            expect(비율400).toBeLessThan(비율100);
        });

        it("dimension이 0이면 0 (0 나눗셈 방지)", () => {
            expect(제스처.러버밴딩_계산(100, 0)).toBe(0);
        });

        it("dimension이 음수여도 0", () => {
            expect(제스처.러버밴딩_계산(100, -10)).toBe(0);
        });

        it("저항 상수를 키우면 더 많이 따라온다", () => {
            const 약 = Math.abs(제스처.러버밴딩_계산(100, 500, 0.3));
            const 강 = Math.abs(제스처.러버밴딩_계산(100, 500, 0.9));
            expect(강).toBeGreaterThan(약);
        });
    });

    describe("닫아야_하는가", () => {
        const size = 600;

        it("아래로 빠르게 던지면 거의 안 움직였어도 닫는다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 20,
                velocity: 1200,
                size,
            });
            expect(d.shouldDismiss).toBe(true);
            expect(d.reason).toBe("flick");
        });

        it("위로 빠르게 던지면 많이 내려와 있어도 되돌린다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 400,
                velocity: -1200,
                size,
            });
            expect(d.shouldDismiss).toBe(false);
            expect(d.reason).toBe("return");
        });

        it("천천히 절반 넘게 끌면 닫는다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 400,
                velocity: 0,
                size,
            });
            expect(d.shouldDismiss).toBe(true);
            expect(d.reason).toBe("distance");
        });

        it("천천히 조금만 끌면 되돌린다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 50,
                velocity: 0,
                size,
            });
            expect(d.shouldDismiss).toBe(false);
            expect(d.reason).toBe("return");
        });

        it("임계 속도 정확히 같으면 던진 것으로 보지 않는다 (초과만 flick)", () => {
            const d = 제스처.닫아야_하는가({
                offset: 10,
                velocity: 제스처.FLICK_VELOCITY_THRESHOLD,
                size,
            });
            expect(d.reason).not.toBe("flick");
        });

        it("음의 임계 속도 정확히 같으면 즉시 return 하지 않고 거리 판정으로 넘어간다", () => {
            // offset 600 + 투사(-400px/s → -199.6) = 400.4 > 300(절반)
            // 위로 던졌지만 임계를 '초과'하지 않았으므로 조기 return 분기를 타지 않고,
            // 거리 판정에서 닫힘으로 결론난다.
            const d = 제스처.닫아야_하는가({
                offset: 600,
                velocity: -제스처.FLICK_VELOCITY_THRESHOLD,
                size,
            });
            expect(d.reason).toBe("distance");
            expect(d.shouldDismiss).toBe(true);
        });

        it("임계를 '초과'해 위로 던지면 얼마나 내려와 있든 되돌린다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 600,
                velocity: -(제스처.FLICK_VELOCITY_THRESHOLD + 1),
                size,
            });
            expect(d.shouldDismiss).toBe(false);
            expect(d.reason).toBe("return");
        });

        it("판정 근거로 예측 지점을 함께 돌려준다", () => {
            const d = 제스처.닫아야_하는가({
                offset: 100,
                velocity: 0,
                size,
            });
            expect(d.projectedOffset).toBe(100);
        });

        it("느린 속도라도 관성 예측이 절반을 넘기면 닫는다", () => {
            // offset 250 + 투사(150px/s → 약 74.85) ≈ 324.85 > 300
            const d = 제스처.닫아야_하는가({
                offset: 250,
                velocity: 150,
                size,
            });
            expect(d.shouldDismiss).toBe(true);
            expect(d.reason).toBe("distance");
        });

        it("옵션으로 임계를 조정할 수 있다", () => {
            const 기본 = 제스처.닫아야_하는가({
                offset: 20,
                velocity: 500,
                size,
            });
            const 엄격 = 제스처.닫아야_하는가(
                { offset: 20, velocity: 500, size },
                { flickVelocity: 2000, decelerationRate: 0.9 }
            );
            expect(기본.shouldDismiss).toBe(true);
            expect(엄격.shouldDismiss).toBe(false);
        });

        it("거리 비율 옵션이 적용된다", () => {
            const d = 제스처.닫아야_하는가(
                { offset: 200, velocity: 0, size },
                { distanceRatio: 0.25 }
            );
            expect(d.shouldDismiss).toBe(true);
        });
    });

    describe("드래그_이동량_계산", () => {
        it("아래로는 1:1로 따라온다", () => {
            expect(제스처.드래그_이동량_계산(120, 600)).toBe(120);
        });

        it("0은 그대로", () => {
            expect(제스처.드래그_이동량_계산(0, 600)).toBe(0);
        });

        it("위로는 저항해서 덜 움직인다", () => {
            const r = 제스처.드래그_이동량_계산(-120, 600);
            expect(r).toBeLessThan(0);
            expect(Math.abs(r)).toBeLessThan(120);
        });
    });

    describe("진행률_계산", () => {
        it("시작은 0", () => {
            expect(제스처.진행률_계산(0, 600)).toBe(0);
        });

        it("절반은 0.5", () => {
            expect(제스처.진행률_계산(300, 600)).toBe(0.5);
        });

        it("끝은 1", () => {
            expect(제스처.진행률_계산(600, 600)).toBe(1);
        });

        it("음수(위로 당김)는 0으로 고정", () => {
            expect(제스처.진행률_계산(-50, 600)).toBe(0);
        });

        it("높이를 넘어도 1로 고정", () => {
            expect(제스처.진행률_계산(900, 600)).toBe(1);
        });

        it("size가 0이면 0 (0 나눗셈 방지)", () => {
            expect(제스처.진행률_계산(100, 0)).toBe(0);
        });
    });

    describe("제스처_시작인가", () => {
        it("임계 미만은 제스처가 아니다", () => {
            expect(제스처.제스처_시작인가(5)).toBe(false);
        });

        it("임계와 같으면 제스처다", () => {
            expect(제스처.제스처_시작인가(제스처.DRAG_THRESHOLD)).toBe(true);
        });

        it("음수 방향도 절댓값으로 판정한다", () => {
            expect(제스처.제스처_시작인가(-20)).toBe(true);
        });

        it("임계를 조정할 수 있다", () => {
            expect(제스처.제스처_시작인가(15, 30)).toBe(false);
        });
    });
});
