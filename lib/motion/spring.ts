import type { SpringSpec, FramerSpring } from "./types";

/**
 * 스프링 파라미터 — Apple 스펙(감쇠비 · 응답시간) → Framer Motion(stiffness · damping) 변환.
 *
 * 물리 3요소를 직접 만지지 않는 이유: mass/stiffness/damping 은 서로 얽혀 있어
 * "조금 더 빠르게"를 만들려다 바운스까지 바뀐다. Apple 은 이걸 두 개의
 * 직관적 파라미터로 분리했다. (Designing Fluid Interfaces, WWDC 2018)
 */

/** 기본 UI — 오버슛 없음. 대부분 여기를 쓴다. */
export const 기본_스프링: SpringSpec = { dampingRatio: 1.0, response: 0.35 };

/** 시트 · 드로어 — 약한 바운스. 제스처가 모멘텀을 실었을 때만 어울린다. */
export const 시트_스프링: SpringSpec = { dampingRatio: 0.8, response: 0.3 };

/** 이동 · 재배치 (PiP 등). */
export const 이동_스프링: SpringSpec = { dampingRatio: 1.0, response: 0.4 };

/** reduced-motion 대체 — 사실상 즉시 정착. */
export const 감속_스프링: SpringSpec = { dampingRatio: 1.0, response: 0.15 };

const MASS = 1;

/**
 * Apple 스펙을 Framer Motion 의 spring transition 으로 변환한다.
 *
 * 표준 2차 진동계에서:
 *   ω_n = 2π / response      (고유 각진동수)
 *   stiffness = m · ω_n²
 *   damping   = 2 · ζ · m · ω_n
 *
 * @param spec 감쇠비 · 응답시간
 * @param velocity 초기 속도 (px/s). 제스처 속도를 인계할 때 넘긴다.
 */
export function 스프링설정(
    spec: SpringSpec,
    velocity?: number
): FramerSpring {
    const omega = (2 * Math.PI) / spec.response;
    const result: FramerSpring = {
        type: "spring",
        stiffness: MASS * omega * omega,
        damping: 2 * spec.dampingRatio * MASS * omega,
        mass: MASS,
    };
    if (velocity !== undefined) {
        result.velocity = velocity;
    }
    return result;
}

/**
 * 사용자가 모션 최소화를 원하면 오버슛을 제거하고 빠르게 정착시킨다.
 * 모션을 없애는 게 아니라 **덜 어지러운 등가물**로 바꾼다.
 */
export function 모션설정_선택(
    spec: SpringSpec,
    reducedMotion: boolean
): SpringSpec {
    return reducedMotion ? 감속_스프링 : spec;
}
