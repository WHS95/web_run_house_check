"use client";

import { useState, useEffect, useCallback } from "react";
import { getFCMToken } from "@/lib/firebase/client";

interface UsePushNotificationOptions {
    crewId: string | null;
}

interface UsePushNotificationReturn {
    isSupported: boolean;
    permission: NotificationPermission | "unsupported";
    isTokenRegistered: boolean;
    isNotificationEnabled: boolean;
    requestPermission: () => Promise<boolean>;
    unregisterToken: () => Promise<boolean>;
    toggleNotification: () => Promise<void>;
    dismissBanner: () => void;
    shouldShowBanner: boolean;
}

const DISMISSED_KEY = "push_dismissed_at";
const DISMISSED_COUNT_KEY = "push_dismissed_count";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const NOTIFICATION_ENABLED_KEY = "push_notification_enabled";

export function usePushNotification({
    crewId,
}: UsePushNotificationOptions): UsePushNotificationReturn {
    const [permission, setPermission] = useState<
        NotificationPermission | "unsupported"
    >("unsupported");
    const [isTokenRegistered, setIsTokenRegistered] = useState(false);
    const [isNotificationEnabled, setIsNotificationEnabled] =
        useState(false);
    const [shouldShowBanner, setShouldShowBanner] = useState(false);

    const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator;

    // 초기 상태 확인
    useEffect(() => {
        if (!isSupported) return;

        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        // localStorage에서 알림 활성화 상태 읽기
        const savedEnabled =
            localStorage.getItem(NOTIFICATION_ENABLED_KEY);

        // 이미 권한이 허용된 경우 배너 숨기고
        // 토큰 미등록 시 자동으로 재등록 시도
        if (currentPermission === "granted") {
            // 사용자가 명시적으로 끈 적이 없으면 활성 상태
            const enabled = savedEnabled !== "false";
            setIsNotificationEnabled(enabled);
            setShouldShowBanner(false);
            if (enabled && !isTokenRegistered && crewId) {
                (async () => {
                    try {
                        await navigator.serviceWorker.register(
                            "/firebase-messaging-sw.js"
                        );
                        const token = await getFCMToken();
                        if (token) {
                            const res = await fetch(
                                "/api/push/token",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json",
                                    },
                                    body: JSON.stringify({
                                        token,
                                        crewId,
                                    }),
                                }
                            );
                            if (res.ok) {
                                setIsTokenRegistered(true);
                            }
                        }
                    } catch {
                        // 토큰 재등록 실패 시 무시
                    }
                })();
            }
            return;
        }

        // 배너 표시 조건 확인 (권한 미허용 상태)
        const dismissedCount = parseInt(
            localStorage.getItem(DISMISSED_COUNT_KEY) || "0"
        );
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);

        if (dismissedCount >= 2) {
            setShouldShowBanner(false);
            return;
        }

        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt);
            if (elapsed < DISMISS_DURATION_MS) {
                setShouldShowBanner(false);
                return;
            }
        }

        // 권한 미허용 시 배너 표시
        setShouldShowBanner(true);
    }, [isSupported, isTokenRegistered, crewId]);

    // 권한 요청 및 토큰 등록
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !crewId) return false;

        try {
            // Service Worker 등록
            await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            );

            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== "granted") return false;

            // FCM 토큰 발급
            const token = await getFCMToken();
            if (!token) return false;

            // 서버에 토큰 등록
            const response = await fetch("/api/push/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, crewId }),
            });

            if (response.ok) {
                setIsTokenRegistered(true);
                setShouldShowBanner(false);
                // dismiss 상태 초기화
                localStorage.removeItem(DISMISSED_KEY);
                localStorage.removeItem(DISMISSED_COUNT_KEY);
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }, [isSupported, crewId]);

    // 토큰 해제 (알림 끄기)
    const unregisterToken = useCallback(async (): Promise<boolean> => {
        try {
            const token = await getFCMToken();
            if (token) {
                await fetch("/api/push/token", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
            }
            setIsTokenRegistered(false);
            setIsNotificationEnabled(false);
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
            return true;
        } catch {
            return false;
        }
    }, []);

    // 토글 핸들러 (ON/OFF 전환)
    const toggleNotification = useCallback(async () => {
        if (isNotificationEnabled) {
            // 켜져 있으면 끄기
            await unregisterToken();
        } else {
            // 꺼져 있으면 켜기
            const success = await requestPermission();
            if (success) {
                setIsNotificationEnabled(true);
                localStorage.setItem(
                    NOTIFICATION_ENABLED_KEY,
                    "true"
                );
            }
        }
    }, [isNotificationEnabled, unregisterToken, requestPermission]);

    // "나중에" 클릭
    const dismissBanner = useCallback(() => {
        const count = parseInt(
            localStorage.getItem(DISMISSED_COUNT_KEY) || "0"
        );
        localStorage.setItem(DISMISSED_COUNT_KEY, String(count + 1));
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setShouldShowBanner(false);
    }, []);

    return {
        isSupported,
        permission,
        isTokenRegistered,
        isNotificationEnabled,
        requestPermission,
        unregisterToken,
        toggleNotification,
        dismissBanner,
        shouldShowBanner,
    };
}
