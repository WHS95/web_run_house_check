"use client";

import { ReactNode } from "react";
import {
    useStickyCollapse,
} from "@/hooks/useStickyCollapse";

interface StickyCollapseHeaderProps {
    /** 펼침 모드 UI */
    expanded: ReactNode;
    /** 축소 모드 UI */
    collapsed: ReactNode;
    /** sticky top 위치. 기본값 "top-14" */
    stickyTop?: string;
    /** 헤더 오프셋 px (IO rootMargin). 기본값 56 */
    headerOffset?: number;
    /** 펼침 모드 maxHeight px. 기본값 120 */
    expandedMaxHeight?: number;
    /** 축소 모드 maxHeight px. 기본값 44 */
    collapsedMaxHeight?: number;
    /** 추가 className */
    className?: string;
}

/**
 * 스크롤 시 자동 축소되는 sticky 헤더 래퍼.
 *
 * 사용법:
 * ```tsx
 * <StickyCollapseHeader
 *     expanded={<FullSelector />}
 *     collapsed={<CompactLabel />}
 * />
 * ```
 */
export default function StickyCollapseHeader({
    expanded,
    collapsed,
    stickyTop = "top-14",
    headerOffset = 56,
    expandedMaxHeight = 120,
    collapsedMaxHeight = 44,
    className = "",
}: StickyCollapseHeaderProps) {
    const { sentinelRef, isStuck } =
        useStickyCollapse({ headerOffset });

    return (
        <>
            {/* sentinel — 일반 문서 흐름 */}
            <div
                ref={sentinelRef}
                className={
                    "h-px w-full"
                    + " pointer-events-none"
                }
                aria-hidden
            />

            {/* sticky 컨테이너 */}
            <div
                className={
                    `sticky ${stickyTop} z-40`
                    + " bg-rh-bg-primary"
                    + " px-4 pt-3 pb-4"
                    + (className
                        ? ` ${className}`
                        : "")
                }
            >
                {/* 펼침 모드 */}
                <div
                    className={
                        "transition-all"
                        + " duration-300"
                        + " ease-out"
                        + " overflow-hidden"
                    }
                    style={{
                        maxHeight: isStuck
                            ? 0
                            : expandedMaxHeight,
                        opacity: isStuck
                            ? 0
                            : 1,
                    }}
                >
                    {expanded}
                </div>

                {/* 축소 모드 */}
                <div
                    className={
                        "transition-all"
                        + " duration-300"
                        + " ease-out"
                        + " overflow-hidden"
                    }
                    style={{
                        maxHeight: isStuck
                            ? collapsedMaxHeight
                            : 0,
                        opacity: isStuck
                            ? 1
                            : 0,
                    }}
                >
                    {collapsed}
                </div>
            </div>
        </>
    );
}
