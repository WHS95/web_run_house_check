"use client";

import React, { useEffect, useCallback, memo, useState } from "react";
import { CircleCheck, CircleSlash, CircleEllipsis } from "lucide-react";

export type NotificationType = "success" | "error" | "loading";

interface PopupNotificationProps {
    isVisible: boolean;
    message: string;
    duration: number;
    onClose: () => void;
    type: NotificationType;
}

const PopupNotification = memo<PopupNotificationProps>(
    ({ isVisible, message, duration, onClose, type }) => {
        const [animState, setAnimState] = useState<
            "entering" | "visible" | "exiting" | "hidden"
        >("hidden");

        const handleAutoClose = useCallback(() => {
            onClose();
        }, [onClose]);

        // 진입/퇴장 애니메이션 관리
        useEffect(() => {
            if (isVisible) {
                // 마운트 후 다음 프레임에서 애니메이션 시작
                requestAnimationFrame(() => {
                    setAnimState("entering");
                    requestAnimationFrame(() => {
                        setAnimState("visible");
                    });
                });
            } else if (animState === "visible" || animState === "entering") {
                setAnimState("exiting");
                const timer = setTimeout(() => setAnimState("hidden"), 300);
                return () => clearTimeout(timer);
            }
        }, [isVisible]);

        // 자동 닫기
        useEffect(() => {
            if (isVisible && duration > 0) {
                const timer = setTimeout(handleAutoClose, duration);
                return () => clearTimeout(timer);
            }
        }, [isVisible, duration, handleAutoClose]);

        if (animState === "hidden" && !isVisible) return null;

        const iconConfig = (() => {
            switch (type) {
                case "success":
                    return { color: "text-blue-500", Component: CircleCheck };
                case "error":
                    return { color: "text-red-500", Component: CircleSlash };
                case "loading":
                    return {
                        color: "text-yellow-500",
                        Component: CircleEllipsis,
                    };
                default:
                    return { color: "text-red-500", Component: CircleSlash };
            }
        })();

        const isActive = animState === "visible";

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rh-bg-primary/30 transition-opacity duration-300"
                style={{ opacity: isActive ? 1 : 0 }}
            >
                <div
                    className="flex flex-col items-center justify-center w-72 h-72 bg-white rounded-xl shadow-2xl md:w-80 md:h-80 transition-all duration-300"
                    style={{
                        transform: isActive
                            ? "scale(1) translateY(0)"
                            : "scale(0.5) translateY(50px)",
                        opacity: isActive ? 1 : 0,
                    }}
                >
                    <div
                        className="transition-all duration-300 delay-100"
                        style={{
                            transform: isActive ? "scale(1)" : "scale(0.5)",
                            opacity: isActive ? 1 : 0,
                        }}
                    >
                        <iconConfig.Component
                            size={95}
                            className={iconConfig.color}
                        />
                    </div>
                    <p
                        className={`px-4 mt-6 text-xl font-semibold ${iconConfig.color} text-center transition-all duration-300 delay-200`}
                        style={{
                            transform: isActive
                                ? "translateY(0)"
                                : "translateY(20px)",
                            opacity: isActive ? 1 : 0,
                        }}
                    >
                        {message}
                    </p>
                </div>
            </div>
        );
    }
);

PopupNotification.displayName = "PopupNotification";

export default PopupNotification;
