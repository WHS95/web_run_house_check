"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    닫아야_하는가,
    드래그_이동량_계산,
    진행률_계산,
    제스처_시작인가,
} from "@/lib/motion/gesture";
import { 스프링설정, 시트_스프링, 모션설정_선택 } from "@/lib/motion/spring";
import type { FramerSpring } from "@/lib/motion/types";
import { haptic } from "@/lib/haptic";

/**
 * 드래그 시트의 React 바인딩.
 *
 * 물리 계산은 전부 `lib/motion/`(순수 함수, 커버리지 100%)에 있고
 * 여기서는 **포인터 이벤트 → 순수 함수 호출 → 상태**만 한다.
 * 계산식을 이 파일에 인라인으로 쓰지 말 것 — 테스트가 불가능해진다.
 */

interface UseDragSheetOptions {
    /** 닫기가 확정됐을 때 호출된다. */
    onClose: () => void;
    /** 비활성화 시 드래그를 받지 않는다. */
    enabled?: boolean;
}

interface UseDragSheetResult {
    /** 시트에 적용할 Y 오프셋 (px). */
    offset: number;
    /** 드래그 중인가. */
    dragging: boolean;
    /** 0~1. 스크림 불투명도를 여기서 파생시킨다. */
    progress: number;
    /** 시트에 적용할 스프링. 드래그 중엔 null(직접 추종). */
    spring: FramerSpring;
    /** 모션 최소화 설정이 켜져 있는가. */
    reducedMotion: boolean;
    /** 드래그 핸들에 스프레드한다. */
    handleProps: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerCancel: (e: React.PointerEvent) => void;
        style: { touchAction: "none" };
    };
    /** 시트 요소 ref — 높이 측정에 쓴다. */
    sheetRef: React.RefObject<HTMLDivElement>;
}

/** 속도 계산에 쓸 최근 포인터 샘플 수. */
const VELOCITY_SAMPLES = 5;

interface Sample {
    y: number;
    t: number;
}

export function useDragSheet({
    onClose,
    enabled = true,
}: UseDragSheetOptions): UseDragSheetResult {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [releaseVelocity, setReleaseVelocity] = useState<number | undefined>(
        undefined
    );
    const [reducedMotion, setReducedMotion] = useState(false);

    const startY = useRef(0);
    const started = useRef(false);
    const samples = useRef<Sample[]>([]);

    // prefers-reduced-motion 은 클라이언트에서만 알 수 있다 (hydration 안전).
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const 높이 = useCallback(
        () => sheetRef.current?.offsetHeight ?? 0,
        []
    );

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!enabled) return;
            // 포인터가 요소 밖으로 나가도 추적이 끊기지 않게 잡아둔다.
            (e.target as Element).setPointerCapture?.(e.pointerId);
            startY.current = e.clientY;
            started.current = false;
            samples.current = [{ y: e.clientY, t: e.timeStamp }];
            setReleaseVelocity(undefined);
        },
        [enabled]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!enabled || samples.current.length === 0) return;

            const delta = e.clientY - startY.current;

            // 임계 전에는 방향을 확정하지 않는다 (탭 오탐 방지).
            if (!started.current) {
                if (!제스처_시작인가(delta)) return;
                started.current = true;
                setDragging(true);
            }

            samples.current.push({ y: e.clientY, t: e.timeStamp });
            if (samples.current.length > VELOCITY_SAMPLES) {
                samples.current.shift();
            }

            setOffset(드래그_이동량_계산(delta, 높이()));
        },
        [enabled, 높이]
    );

    /** 최근 샘플들로 릴리즈 속도(px/s)를 구한다. */
    const 속도계산 = useCallback((): number => {
        const s = samples.current;
        if (s.length < 2) return 0;
        const 처음 = s[0];
        const 마지막 = s[s.length - 1];
        const dt = 마지막.t - 처음.t;
        if (dt <= 0) return 0;
        return ((마지막.y - 처음.y) / dt) * 1000;
    }, []);

    const 종료 = useCallback(
        (e: React.PointerEvent) => {
            (e.target as Element).releasePointerCapture?.(e.pointerId);

            if (!started.current) {
                samples.current = [];
                return;
            }

            const velocity = 속도계산();
            const size = 높이();
            const decision = 닫아야_하는가({ offset, velocity, size });

            started.current = false;
            samples.current = [];
            setDragging(false);
            setReleaseVelocity(velocity);

            if (decision.shouldDismiss) {
                // 시각과 촉각은 같은 순간에 떨어져야 한다.
                haptic.light();
                onClose();
            } else {
                setOffset(0);
            }
        },
        [offset, onClose, 속도계산, 높이]
    );

    // 시트가 닫혔다 다시 열릴 때 위치를 초기화한다.
    useEffect(() => {
        if (!enabled) {
            setOffset(0);
            setDragging(false);
            started.current = false;
            samples.current = [];
        }
    }, [enabled]);

    return {
        offset,
        dragging,
        progress: 진행률_계산(offset, 높이()),
        spring: 스프링설정(
            모션설정_선택(시트_스프링, reducedMotion),
            releaseVelocity
        ),
        reducedMotion,
        handleProps: {
            onPointerDown,
            onPointerMove,
            onPointerUp: 종료,
            onPointerCancel: 종료,
            style: { touchAction: "none" },
        },
        sheetRef,
    };
}
