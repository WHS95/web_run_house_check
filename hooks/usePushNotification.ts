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
    requestPermission: () => Promise<boolean>;
    dismissBanner: () => void;
    shouldShowBanner: boolean;
}

const DISMISSED_KEY = "push_dismissed_at";
const DISMISSED_COUNT_KEY = "push_dismissed_count";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export function usePushNotification({
    crewId,
}: UsePushNotificationOptions): UsePushNotificationReturn {
    const [permission, setPermission] = useState<
        NotificationPermission | "unsupported"
    >("unsupported");
    const [isTokenRegistered, setIsTokenRegistered] = useState(false);
    const [shouldShowBanner, setShouldShowBanner] = useState(false);

    const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator;

    // 초기 상태 확인
    useEffect(() => {
        if (!isSupported) return;

        setPermission(Notification.permission);

        // 배너 표시 조건 확인
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

        // 토큰 미등록 + 권한 미결정/미허용 시 배너 표시
        if (
            Notification.permission !== "granted" ||
            !isTokenRegistered
        ) {
            setShouldShowBanner(true);
        }
    }, [isSupported, isTokenRegistered]);

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
        requestPermission,
        dismissBanner,
        shouldShowBanner,
    };
}
