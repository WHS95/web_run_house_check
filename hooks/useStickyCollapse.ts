"use client";

import {
    useRef,
    useState,
    useEffect,
    type RefObject,
} from "react";

interface UseStickyCollapseOptions {
    /** sticky 헤더 오프셋 (px). 기본값 56 */
    headerOffset?: number;
    /** 디바운스 지연 (ms). 기본값 8 */
    debounce?: number;
}

interface UseStickyCollapseReturn {
    /** sentinel div에 연결할 ref */
    sentinelRef: RefObject<HTMLDivElement>;
    /** 현재 sticky 축소 상태 */
    isStuck: boolean;
}

/**
 * 스크롤 시 sticky 헤더 축소 감지 훅.
 *
 * sentinel(보이지 않는 1px div)이 헤더 뒤로
 * 사라지면 isStuck = true.
 * 다시 보이면 isStuck = false.
 *
 * .main-content를 IO root로 사용하며,
 * 8ms 디바운스로 경계 떨림을 방지합니다.
 */
export function useStickyCollapse(
    options?: UseStickyCollapseOptions,
): UseStickyCollapseReturn {
    const {
        headerOffset = 56,
        debounce = 8,
    } = options ?? {};

    const sentinelRef =
        useRef<HTMLDivElement>(null!);
    const [isStuck, setIsStuck] =
        useState(false);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const root = document.querySelector(
            ".main-content",
        );
        if (!root) return;

        let timer: ReturnType<
            typeof setTimeout
        >;
        const obs = new IntersectionObserver(
            ([entry]) => {
                clearTimeout(timer);
                const next =
                    !entry.isIntersecting;
                timer = setTimeout(
                    () => setIsStuck(next),
                    debounce,
                );
            },
            {
                root,
                rootMargin:
                    `-${headerOffset}px 0px 0px 0px`,
                threshold: 0,
            },
        );
        obs.observe(el);
        return () => {
            clearTimeout(timer);
            obs.disconnect();
        };
    }, [headerOffset, debounce]);

    return { sentinelRef, isStuck };
}
