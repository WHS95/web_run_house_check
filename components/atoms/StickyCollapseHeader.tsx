"use client";

import { ReactNode, useEffect, useState } from "react";
import {
    motion,
    useMotionValue,
    useTransform,
    animate,
} from "framer-motion";

interface StickyCollapseHeaderProps {
    /** 펼침 모드 UI */
    expanded: ReactNode;
    /** 축소 모드 UI */
    collapsed: ReactNode;
    /** sticky top 위치. 기본값 "top-14" */
    stickyTop?: string;
    /** 펼침 모드 maxHeight px. 기본값 120 */
    expandedMaxHeight?: number;
    /** 축소 모드 maxHeight px. 기본값 44 */
    collapsedMaxHeight?: number;
    /** 추가 className */
    className?: string;
}

/**
 * iOS gesture 패턴으로 펼침/축소를 처리하는 sticky 헤더.
 *
 * - progress (0..1) motion value가 손가락/휠을 따라 연속적으로 변화
 * - 펼침 UI와 축소 UI의 maxHeight/opacity가 progress를 따라 cross-fade
 * - 손/휠을 떼면 velocity 기반 spring snap (0 또는 1)
 * - 콘텐츠 길이/스크롤 가능 여부와 무관하게 동작
 *
 * 모드 결정:
 * - `progress > 0.5` AND 손가락 ↓ → expand 의도 (collapse 모드 진입)
 * - `progress < 0.5` AND 최상단 + 손가락 ↑ → collapse 의도 (collapse 모드 진입)
 * - 그 외 → 브라우저 네이티브 스크롤
 */
export default function StickyCollapseHeader({
    expanded,
    collapsed,
    stickyTop = "top-14",
    expandedMaxHeight = 120,
    collapsedMaxHeight = 44,
    className = "",
}: StickyCollapseHeaderProps) {
    const progress = useMotionValue(0);

    /* expanded UI: progress 0=full → 1=hidden */
    const expandedH = useTransform(
        progress,
        [0, 1],
        [expandedMaxHeight, 0],
    );
    const expandedOpacity = useTransform(
        progress,
        [0, 1],
        [1, 0],
    );

    /* collapsed UI: progress 0=hidden → 1=full */
    const collapsedH = useTransform(
        progress,
        [0, 1],
        [0, collapsedMaxHeight],
    );
    const collapsedOpacity = useTransform(
        progress,
        [0, 1],
        [0, 1],
    );

    /* progress motion value 미러 (디버그/외부 노출 미사용 — 필요 시 prop으로 콜백 전달 가능) */
    const [, setIsCollapsed] = useState(false);
    useEffect(() => {
        const unsub = progress.on("change", (v) => {
            setIsCollapsed(v > 0.5);
        });
        return unsub;
    }, [progress]);

    /* pointer 기반 pan 제스처 (iOS gesture recognizer 패턴) */
    useEffect(() => {
        const el = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        if (!el) return;
        let startY = 0;
        let startProgress = 0;
        let startTime = 0;
        let mode: "idle" | "collapse" | "scroll" = "idle";
        const SENSITIVITY = 150;
        const VELOCITY_THRESHOLD = 400;

        const onPointerDown = (e: PointerEvent) => {
            startY = e.clientY;
            startTime = e.timeStamp;
            startProgress = progress.get();
            mode = "idle";
        };

        const onPointerMove = (e: PointerEvent) => {
            if (
                e.pointerType === "mouse" &&
                e.buttons === 0
            )
                return;
            const dy = e.clientY - startY;

            if (mode === "idle") {
                if (Math.abs(dy) < 5) return;
                const atTop = el.scrollTop <= 0;
                const cur = progress.get();
                const fingerDown = dy > 0;
                const fingerUp = dy < 0;

                if (cur > 0.5 && fingerDown) {
                    mode = "collapse";
                } else if (
                    cur < 0.5 &&
                    atTop &&
                    fingerUp
                ) {
                    mode = "collapse";
                } else {
                    mode = "scroll";
                }
            }

            if (mode === "collapse") {
                const newProg = Math.max(
                    0,
                    Math.min(
                        1,
                        startProgress + -dy / SENSITIVITY,
                    ),
                );
                progress.set(newProg);
            }
        };

        const onPointerEnd = (e: PointerEvent) => {
            if (mode !== "collapse") {
                mode = "idle";
                return;
            }
            const elapsed = e.timeStamp - startTime;
            const dy = e.clientY - startY;
            const velocity =
                elapsed > 0 ? (-dy / elapsed) * 1000 : 0;
            const cur = progress.get();

            let target = cur > 0.5 ? 1 : 0;
            if (velocity > VELOCITY_THRESHOLD) target = 1;
            else if (velocity < -VELOCITY_THRESHOLD)
                target = 0;

            animate(progress, target, {
                type: "spring",
                damping: 30,
                stiffness: 350,
            });
            mode = "idle";
        };

        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerEnd);
        el.addEventListener("pointercancel", onPointerEnd);

        return () => {
            el.removeEventListener(
                "pointerdown",
                onPointerDown,
            );
            el.removeEventListener(
                "pointermove",
                onPointerMove,
            );
            el.removeEventListener(
                "pointerup",
                onPointerEnd,
            );
            el.removeEventListener(
                "pointercancel",
                onPointerEnd,
            );
        };
    }, [progress]);

    /* desktop wheel 제스처 */
    useEffect(() => {
        const el = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        if (!el) return;
        let endTimer: ReturnType<typeof setTimeout> | null =
            null;

        const snap = () => {
            const cur = progress.get();
            const target = cur > 0.5 ? 1 : 0;
            if (cur !== target) {
                animate(progress, target, {
                    type: "spring",
                    damping: 30,
                    stiffness: 350,
                });
            }
        };

        const onWheel = (e: WheelEvent) => {
            const cur = progress.get();
            const atTop = el.scrollTop <= 0;
            if (!atTop) return;

            const dy = e.deltaY;
            if (dy > 0 && cur < 1) {
                progress.set(Math.min(1, cur + dy / 80));
                e.preventDefault();
            } else if (dy < 0 && cur > 0) {
                progress.set(Math.max(0, cur + dy / 80));
                e.preventDefault();
            } else {
                return;
            }

            if (endTimer) clearTimeout(endTimer);
            endTimer = setTimeout(snap, 150);
        };

        el.addEventListener("wheel", onWheel, {
            passive: false,
        });
        return () => {
            el.removeEventListener("wheel", onWheel);
            if (endTimer) clearTimeout(endTimer);
        };
    }, [progress]);

    return (
        <div
            className={
                `sticky ${stickyTop} z-40`
                + " bg-rh-bg-primary"
                + " px-4 pt-3 pb-4"
                + (className ? ` ${className}` : "")
            }
        >
            {/* 펼침 모드 */}
            <motion.div
                style={{
                    maxHeight: expandedH,
                    opacity: expandedOpacity,
                }}
                className="overflow-hidden"
            >
                {expanded}
            </motion.div>

            {/* 축소 모드 */}
            <motion.div
                style={{
                    maxHeight: collapsedH,
                    opacity: collapsedOpacity,
                }}
                className="overflow-hidden"
            >
                {collapsed}
            </motion.div>
        </div>
    );
}
