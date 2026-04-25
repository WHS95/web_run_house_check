"use client";

import { useEffect, useState } from "react";

/**
 * 모달/시트를 .mobile-viewport에 portal 마운트하고
 * 모달이 열린 동안 .main-content 스크롤을 잠근다.
 *
 * .mobile-viewport는 position: relative, overflow: hidden, 100dvh이므로
 * 자식의 absolute inset-0가 viewport 전체를 차지하고 paint clipping이
 * 발생하지 않는다.
 */
export function useModalViewportPortal(open: boolean) {
    const [container, setContainer] =
        useState<HTMLElement | null>(null);

    useEffect(() => {
        const target =
            (document.querySelector(
                ".mobile-viewport",
            ) as HTMLElement | null) || document.body;
        setContainer(target);
    }, []);

    useEffect(() => {
        if (!open) return;
        const main = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        const prev = main?.style.overflow;
        if (main) main.style.overflow = "hidden";
        return () => {
            if (main) main.style.overflow = prev || "";
        };
    }, [open]);

    return container;
}
