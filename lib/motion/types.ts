/**
 * 인터랙션 · 모션 레이어 타입.
 * 컨벤션: 함수명은 한글, 타입·필드는 영어. (lib/motion/README.md 참조)
 */

/** 드래그 축. 현재는 세로 시트만 사용한다. */
export type DragAxis = "y" | "x";

/** 드래그 릴리즈 시점의 상태. */
export interface DragRelease {
    /** 시작점 기준 이동량 (px). 아래로 끌면 양수. */
    offset: number;
    /** 릴리즈 속도 (px/s). 아래로 던지면 양수. */
    velocity: number;
    /** 드래그 대상의 크기 (px). 세로 시트면 높이. */
    size: number;
}

/** 닫기 판정 결과. 왜 그렇게 판정했는지까지 돌려준다(디버깅·테스트 용이). */
export interface DismissDecision {
    /** 닫아야 하는가. */
    shouldDismiss: boolean;
    /** 판정 근거. */
    reason: "flick" | "distance" | "return";
    /** 관성이 데려갈 것으로 예측한 최종 위치 (px). */
    projectedOffset: number;
}

/**
 * Apple 스펙 스프링. 물리 3요소가 아니라 감쇠비·응답시간으로 표현한다.
 * (Designing Fluid Interfaces, WWDC 2018)
 */
export interface SpringSpec {
    /** 감쇠비. 1.0 = 오버슛 없음, <1.0 = 튕김. */
    dampingRatio: number;
    /** 응답시간 (초). 목표에 도달하는 속도. duration이 아니다. */
    response: number;
}

/** Framer Motion 의 spring transition 형태. */
export interface FramerSpring {
    type: "spring";
    stiffness: number;
    damping: number;
    mass: number;
    /** 초기 속도 (px/s). 제스처 속도를 인계할 때 채운다. */
    velocity?: number;
}
