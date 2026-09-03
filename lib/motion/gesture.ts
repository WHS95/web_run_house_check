import type { DragRelease, DismissDecision } from "./types";

/**
 * 제스처 물리 — 순수 계산만. React·DOM 의존 금지.
 * 근거: Apple "Designing Fluid Interfaces" (WWDC 2018)
 */

/**
 * iOS 스크롤 감속률. 1에 가까울수록 멀리 미끄러진다.
 * 0.998 = 일반 스크롤 감,  0.99 = 더 빨리 멈춤.
 */
export const DECELERATION_RATE = 0.998;

/** 이 속도(px/s)를 넘겨 던지면 거리와 무관하게 닫는다. */
export const FLICK_VELOCITY_THRESHOLD = 400;

/** 관성 예측 지점이 높이의 이 비율을 넘으면 닫는다. */
export const DISMISS_DISTANCE_RATIO = 0.5;

/** 러버밴딩 저항 상수. 클수록 덜 저항한다(더 따라온다). */
export const RUBBERBAND_CONSTANT = 0.55;

/** 제스처로 인정하기까지 필요한 최소 이동량 (px). */
export const DRAG_THRESHOLD = 10;

/**
 * 관성이 데려갈 추가 거리를 계산한다.
 *
 * 교과서의 `v²/(2a)`가 아니라 **지수 감쇠** 형태다. iOS 스크롤 감속이 쓰는 식이며,
 * Apple의 Designing Fluid Interfaces 샘플 코드와 동일하다.
 *
 * @param velocity 릴리즈 속도 (px/s)
 * @param decelerationRate 감속률 (0 < rate < 1)
 * @returns 현재 위치에서 추가로 미끄러질 거리 (px). 속도 부호를 따른다.
 */
export function 모멘텀_투사계산(
    velocity: number,
    decelerationRate: number = DECELERATION_RATE
): number {
    return (
        ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
    );
}

/**
 * 경계를 넘어선 이동량에 점진적 저항을 적용한다.
 *
 * 하드 스톱은 "얼었다"로 읽히고, 점진적 저항은 "반응하지만 더 없다"로 읽힌다.
 * 많이 끌수록 덜 따라온다.
 *
 * @param overshoot 경계를 넘어선 양 (px)
 * @param dimension 기준 크기 (px). 보통 시트 높이.
 * @param constant 저항 상수
 * @returns 실제로 이동시킬 거리 (px). 항상 |overshoot| 이하.
 */
export function 러버밴딩_계산(
    overshoot: number,
    dimension: number,
    constant: number = RUBBERBAND_CONSTANT
): number {
    if (dimension <= 0) return 0;
    return (
        (overshoot * dimension * constant) /
        (dimension + constant * Math.abs(overshoot))
    );
}

/**
 * 드래그를 놓았을 때 닫을지 되돌릴지 판정한다.
 *
 * **위치만 보지 않는다.** 빠르게 튕기면 조금만 움직여도 닫히고,
 * 천천히 끌면 많이 움직여도 제자리로 돌아가야 한다 — 그게 손가락의 의도다.
 *
 * 판정 순서:
 *  1. 위로 던졌으면(음수 속도) 무조건 되돌린다.
 *  2. 아래로 임계 이상 던졌으면 닫는다 (flick).
 *  3. 관성 예측 지점이 높이의 절반을 넘으면 닫는다 (distance).
 *  4. 그 외 되돌린다 (return).
 */
export function 닫아야_하는가(
    release: DragRelease,
    options: {
        flickVelocity?: number;
        distanceRatio?: number;
        decelerationRate?: number;
    } = {}
): DismissDecision {
    const {
        flickVelocity = FLICK_VELOCITY_THRESHOLD,
        distanceRatio = DISMISS_DISTANCE_RATIO,
        decelerationRate = DECELERATION_RATE,
    } = options;

    const { offset, velocity, size } = release;
    const projectedOffset =
        offset + 모멘텀_투사계산(velocity, decelerationRate);

    // 위로 던졌다 — 닫을 의도가 아니다.
    if (velocity < -flickVelocity) {
        return { shouldDismiss: false, reason: "return", projectedOffset };
    }

    // 아래로 충분히 던졌다 — 거리와 무관하게 닫는다.
    if (velocity > flickVelocity) {
        return { shouldDismiss: true, reason: "flick", projectedOffset };
    }

    // 던지지 않았다면 관성 예측 지점으로 판정한다.
    if (projectedOffset > size * distanceRatio) {
        return { shouldDismiss: true, reason: "distance", projectedOffset };
    }

    return { shouldDismiss: false, reason: "return", projectedOffset };
}

/**
 * 드래그 중 실제로 적용할 이동량을 계산한다.
 *
 * 아래로는 자유롭게 따라오고, 위로는(경계 밖) 러버밴딩으로 저항한다.
 *
 * @param rawOffset 포인터가 이동한 원본 거리 (px)
 * @param size 시트 높이 (px)
 */
export function 드래그_이동량_계산(
    rawOffset: number,
    size: number
): number {
    if (rawOffset >= 0) return rawOffset;
    // 위쪽은 열린 상태가 경계다 — 넘어가면 저항한다.
    return 러버밴딩_계산(rawOffset, size);
}

/**
 * 드래그 진행률 (0~1). 스크림 불투명도를 시트와 같은 값에서 파생시키는 데 쓴다.
 * 시트와 스크림이 따로 놀면 즉시 어색해진다.
 */
export function 진행률_계산(offset: number, size: number): number {
    if (size <= 0) return 0;
    const ratio = offset / size;
    if (ratio < 0) return 0;
    if (ratio > 1) return 1;
    return ratio;
}

/**
 * 포인터 이동이 제스처로 인정될 만한지 판정한다.
 * 임계 전에는 방향을 확정하지 않는다(오탐 방지).
 */
export function 제스처_시작인가(
    delta: number,
    threshold: number = DRAG_THRESHOLD
): boolean {
    return Math.abs(delta) >= threshold;
}
