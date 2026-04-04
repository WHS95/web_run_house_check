"use client";

import { useEffect } from "react";

/**
 * iOS PWA 키보드 닫힘 후 화면 올라감 고정 버그 수정
 * - visualViewport resize 이벤트로 키보드 닫힘 감지
 * - 키보드 닫힐 때 window/body 스크롤 위치를 0으로 리셋
 */
export default function KeyboardScrollFix() {
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        let prevHeight = vv.height;

        const handleResize = () => {
            const currentHeight = vv.height;

            // 키보드가 닫힘: viewport 높이가 커짐
            if (currentHeight > prevHeight) {
                // 스크롤 위치 리셋
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }

            prevHeight = currentHeight;
        };

        // blur 이벤트로도 보완 (input에서 포커스 빠질 때)
        const handleFocusOut = () => {
            requestAnimationFrame(() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            });
        };

        vv.addEventListener("resize", handleResize);
        document.addEventListener("focusout", handleFocusOut);

        return () => {
            vv.removeEventListener("resize", handleResize);
            document.removeEventListener(
                "focusout",
                handleFocusOut
            );
        };
    }, []);

    return null;
}
