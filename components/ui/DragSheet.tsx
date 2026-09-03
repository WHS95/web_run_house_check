"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModalViewportPortal } from "@/hooks/useModalViewportPortal";
import { useDragSheet } from "@/hooks/useDragSheet";
import { 스프링설정, 기본_스프링, 모션설정_선택 } from "@/lib/motion/spring";
import { cn } from "@/lib/utils";

/**
 * 공용 드래그 바텀시트 프리미티브.
 *
 * 새 시트를 만들 때 `motion.div`에 `drag`를 직접 붙이지 말고 이걸 쓴다.
 * (CLAUDE.md 애니메이션 규칙 5번 / lib/motion/README.md)
 *
 * 여기서 처리하는 것:
 * - 속도 기반 닫기 판정 (위치만 보지 않는다)
 * - 릴리즈 속도를 스프링에 인계 (드래그↔애니메이션 이음매 제거)
 * - 모멘텀 투사 · 러버밴딩
 * - 스크림을 시트와 같은 진행률에 동기화
 * - 햅틱 · prefers-reduced-motion · ESC · 포커스 복원
 * - `.mobile-viewport` 포털 (이 앱은 position: fixed 사용 금지)
 */

interface DragSheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** 스크린리더용 이름. */
    label: string;
    /** 드래그 핸들을 숨긴다 (드래그는 여전히 가능). */
    hideHandle?: boolean;
    /** 시트가 화면 높이의 최대 몇 %를 차지할지. */
    maxHeightClassName?: string;
    className?: string;
    /** 스크림 클릭으로 닫히지 않게 한다 (파괴적 작업 등). */
    dismissOnScrimClick?: boolean;
}

export default function DragSheet({
    open,
    onClose,
    children,
    label,
    hideHandle = false,
    maxHeightClassName = "max-h-[88%]",
    className,
    dismissOnScrimClick = true,
}: DragSheetProps) {
    const container = useModalViewportPortal(open);
    const { offset, dragging, progress, spring, reducedMotion, handleProps, sheetRef } =
        useDragSheet({ onClose, enabled: open });

    const 이전포커스 = useRef<HTMLElement | null>(null);

    // ESC 로 닫기 + 포커스 복원
    useEffect(() => {
        if (!open) return;
        이전포커스.current = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            이전포커스.current?.focus?.();
        };
    }, [open, onClose]);

    if (!container) return null;

    // 스크림은 시트와 같은 값에서 파생시킨다 — 따로 놀면 즉시 어색해진다.
    const 스크림불투명도 = 1 - progress;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className='absolute inset-0 z-50'>
                    {/* 스크림 */}
                    <motion.div
                        className='absolute inset-0 bg-black/50'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 스크림불투명도 }}
                        exit={{ opacity: 0 }}
                        transition={
                            dragging
                                ? { duration: 0 }
                                : 스프링설정(
                                      모션설정_선택(기본_스프링, reducedMotion)
                                  )
                        }
                        onClick={dismissOnScrimClick ? onClose : undefined}
                    />

                    {/* 시트 */}
                    <motion.div
                        ref={sheetRef}
                        role='dialog'
                        aria-modal='true'
                        aria-label={label}
                        className={cn(
                            "absolute bottom-0 left-0 right-0 z-10 flex flex-col",
                            "rounded-t-2xl bg-rh-bg-surface pb-safe overflow-hidden",
                            maxHeightClassName,
                            className
                        )}
                        initial={{ y: "100%" }}
                        animate={{ y: offset }}
                        exit={{ y: "100%" }}
                        // 드래그 중엔 손가락을 1:1로 따라간다(스프링 개입 금지).
                        // 놓는 순간 릴리즈 속도를 인계받은 스프링으로 넘어간다.
                        transition={dragging ? { duration: 0 } : spring}
                    >
                        {/* 드래그 핸들 — 여기서 제스처를 받는다 */}
                        <div
                            {...handleProps}
                            className='shrink-0 cursor-grab active:cursor-grabbing'
                        >
                            {!hideHandle && (
                                <div className='flex justify-center pt-3 pb-2'>
                                    <div className='h-1 w-10 rounded-full bg-rh-bg-muted' />
                                </div>
                            )}
                        </div>

                        <div className='flex-1 overflow-y-auto overscroll-contain'>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        container
    );
}
