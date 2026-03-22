"use client";

import React, {
    useState,
    useEffect,
    useCallback,
} from "react";
import Image from "next/image";

/**
 * PWA 스플래시 화면
 * - 세션당 최초 1회만 표시 (sessionStorage 활용)
 * - 1.5초 후 자동 페이드아웃
 */
const SplashScreen: React.FC = () => {
    const [phase, setPhase] = useState<
        "hidden" | "visible" | "fading"
    >("hidden");

    const dismiss = useCallback(() => {
        setPhase("fading");
        // 페이드아웃 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => setPhase("hidden"), 500);
    }, []);

    useEffect(() => {
        // 이미 이번 세션에서 본 경우 표시하지 않음
        if (sessionStorage.getItem("rh_splash_shown")) {
            return;
        }

        setPhase("visible");
        sessionStorage.setItem("rh_splash_shown", "1");

        // 1.5초 후 자동 페이드아웃
        const timer = setTimeout(dismiss, 1500);
        return () => clearTimeout(timer);
    }, [dismiss]);

    if (phase === "hidden") return null;

    return (
        <div
            className={`
                splash-screen splash-overlay
                ${phase === "fading"
                    ? "splash-fade-out" : ""}
            `}
            style={{
                backgroundColor: "var(--rh-bg-primary)",
            }}
        >
            {/* 로고 */}
            <div className="text-center">
                <Image
                    src="/logo.png"
                    alt="런하우스 로고"
                    width={128}
                    height={128}
                    className="w-32 h-auto mx-auto mb-6
                        sm:w-36 splash-logo"
                    priority
                />
            </div>

            {/* 로딩 인디케이터 */}
            <div className="flex flex-col items-center
                mt-12 space-y-4"
            >
                <div className="flex space-x-2">
                    <div
                        className="w-2 h-2 rounded-full
                            splash-dot"
                        style={{
                            backgroundColor:
                                "var(--rh-accent)",
                        }}
                    />
                    <div
                        className="w-2 h-2 rounded-full
                            splash-dot"
                        style={{
                            backgroundColor:
                                "var(--rh-accent)",
                        }}
                    />
                    <div
                        className="w-2 h-2 rounded-full
                            splash-dot"
                        style={{
                            backgroundColor:
                                "var(--rh-accent)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
