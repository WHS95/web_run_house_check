"use client";

import { useEffect } from "react";

/**
 * iOS PWA 키보드 닫힘 후 화면 올라감 고정 버그 수정
 *
 * iOS는 키보드가 열릴 때 window를 강제로 스크롤하고,
 * 닫힐 때 원래대로 안 돌려놓는 버그가 있음.
 * visualViewport.offsetTop + scroll 리셋으로 해결.
 */
export default function KeyboardScrollFix() {
    useEffect(() => {
        // iOS 판별 (PWA 포함)
        const isIOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1);
        if (!isIOS) return;

        const vv = window.visualViewport;

        const resetScroll = () => {
            // window 레벨 스크롤 리셋
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // visualViewport offset 보정
            if (vv && vv.offsetTop > 0) {
                window.scrollTo(0, 0);
            }

            // mobile-viewport가 밀렸을 수 있으므로 강제 리셋
            const viewport = document.querySelector(
                ".mobile-viewport"
            ) as HTMLElement | null;
            if (viewport) {
                viewport.style.transform = "translateY(0)";
                // 강제 리플로우 후 제거
                void viewport.offsetHeight;
                viewport.style.transform = "";
            }
        };

        // 1) input/textarea blur 시 키보드 닫힘 감지
        const handleFocusOut = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                // 키보드 닫히는 애니메이션 대기 후 리셋
                setTimeout(resetScroll, 100);
                setTimeout(resetScroll, 300);
            }
        };

        // 2) visualViewport scroll 이벤트 (iOS가 viewport를 이동시킬 때)
        const handleViewportScroll = () => {
            if (vv && vv.offsetTop > 0) {
                // 포커스된 input이 없으면 키보드가 닫힌 상태
                const active = document.activeElement;
                const isInputFocused =
                    active &&
                    (active.tagName === "INPUT" ||
                        active.tagName === "TEXTAREA" ||
                        (active as HTMLElement).isContentEditable);

                if (!isInputFocused) {
                    resetScroll();
                }
            }
        };

        // 3) visualViewport resize (키보드 열림/닫힘)
        let prevHeight = vv?.height ?? window.innerHeight;
        const handleViewportResize = () => {
            if (!vv) return;
            const curr = vv.height;
            // 키보드 닫힘: 높이가 100px 이상 커짐
            if (curr - prevHeight > 100) {
                setTimeout(resetScroll, 50);
                setTimeout(resetScroll, 300);
            }
            prevHeight = curr;
        };

        document.addEventListener("focusout", handleFocusOut);
        vv?.addEventListener("scroll", handleViewportScroll);
        vv?.addEventListener("resize", handleViewportResize);

        return () => {
            document.removeEventListener(
                "focusout",
                handleFocusOut
            );
            vv?.removeEventListener(
                "scroll",
                handleViewportScroll
            );
            vv?.removeEventListener(
                "resize",
                handleViewportResize
            );
        };
    }, []);

    return null;
}
