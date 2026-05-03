"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getFCMToken } from "@/lib/firebase/client";
import {
    registerPushTokenAction,
    deactivatePushTokenAction,
} from "@/app/mypage/actions";
import type { ToastTone } from "@/components/molecules/Toast";

interface UsePushNotificationOptions {
    crewId: string | null;
}

interface PushToastState {
    message: string;
    tone: ToastTone;
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
    toast: PushToastState | null;
    dismissToast: () => void;
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
    const [toast, setToast] = useState<PushToastState | null>(null);

    const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator;

    // isTokenRegistered를 ref로 추적 — effect가 토큰 상태 변화에
    // 재실행되어 isNotificationEnabled를 덮어쓰는 레이스를 방지
    const isTokenRegisteredRef = useRef(isTokenRegistered);
    useEffect(() => {
        isTokenRegisteredRef.current = isTokenRegistered;
    }, [isTokenRegistered]);

    const dismissToast = useCallback(() => setToast(null), []);

    // 초기 상태 확인 (mount + crewId 변경 시에만 실행)
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
            if (enabled && !isTokenRegisteredRef.current && crewId) {
                (async () => {
                    try {
                        await navigator.serviceWorker.register(
                            "/firebase-messaging-sw.js"
                        );
                        const token = await getFCMToken();
                        if (token) {
                            const result = await registerPushTokenAction({
                                token,
                                crewId,
                            });
                            if (result.success) {
                                setIsTokenRegistered(true);
                            }
                        }
                    } catch {
                        // 토큰 재등록 실패 시 무시 (다음 사용자 액션에서 재시도)
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
    }, [isSupported, crewId]);

    // 권한 요청 및 토큰 등록
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.warn("[push] 지원하지 않는 환경");
            setToast({
                tone: "error",
                message: "이 브라우저에서는 알림을 지원하지 않습니다.",
            });
            return false;
        }
        if (!crewId) {
            console.warn("[push] crewId 없음 — 토큰 등록 불가");
            setToast({
                tone: "error",
                message: "크루 정보를 확인할 수 없어 알림을 등록할 수 없습니다.",
            });
            return false;
        }

        try {
            // 사용자 제스처 직후 즉시 권한 요청 (iOS Safari 호환)
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "denied") {
                console.info("[push] 권한 거부:", result);
                setShouldShowBanner(false);
                setToast({
                    tone: "error",
                    message:
                        "브라우저에서 알림이 차단되어 있어요. 설정에서 알림 권한을 허용해주세요.",
                });
                return false;
            }

            if (result !== "granted") {
                // 'default' (사용자가 닫음) — 무한루프 방지를 위해 배너만 닫음
                setShouldShowBanner(false);
                return false;
            }

            // 권한이 grant 된 시점부터 배너는 항상 닫는다.
            // 토큰 등록이 실패해도 다음 페이지 로드의 useEffect 자동 재등록
            // 분기로 처리됨.
            setShouldShowBanner(false);
            localStorage.removeItem(DISMISSED_KEY);
            localStorage.removeItem(DISMISSED_COUNT_KEY);

            // Service Worker 등록 (권한 확인 후)
            await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            );

            // FCM 토큰 발급
            const token = await getFCMToken();
            if (!token) {
                console.warn("[push] FCM 토큰 발급 실패");
                setToast({
                    tone: "error",
                    message:
                        "알림 권한은 허용했지만 토큰 발급에 실패했어요. 잠시 후 다시 시도해주세요.",
                });
                return false;
            }

            // 서버에 토큰 등록
            const registerResult = await registerPushTokenAction({ token, crewId });

            if (!registerResult.success) {
                console.warn(
                    "[push] 토큰 서버 등록 실패:",
                    registerResult.code,
                    registerResult.message
                );
                setToast({
                    tone: "error",
                    message:
                        registerResult.message ||
                        "알림 등록에 실패했어요. 잠시 후 다시 시도해주세요.",
                });
                return false;
            }

            setIsTokenRegistered(true);
            setIsNotificationEnabled(true);
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
            setToast({
                tone: "success",
                message: "알림을 켰어요. 새로운 소식을 바로 받아볼 수 있어요.",
            });
            return true;
        } catch (err) {
            console.error("[push] requestPermission 예외:", err);
            setToast({
                tone: "error",
                message:
                    "알림 설정 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
            });
            return false;
        }
    }, [isSupported, crewId]);

    // 토큰 해제 (알림 끄기)
    const unregisterToken = useCallback(async (): Promise<boolean> => {
        try {
            const token = await getFCMToken();
            if (token) {
                await deactivatePushTokenAction({ token });
            }
            setIsTokenRegistered(false);
            setIsNotificationEnabled(false);
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
            return true;
        } catch {
            return false;
        }
    }, []);

    // 토글 핸들러 (ON/OFF 전환) — 낙관적 UI, 실패 시 롤백
    const toggleNotification = useCallback(async () => {
        if (isNotificationEnabled) {
            // OFF: 즉시 UI 반영, 토큰 해제는 백그라운드로
            setIsNotificationEnabled(false);
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
            void unregisterToken();
            setToast({
                tone: "info",
                message: "알림이 꺼졌어요.",
            });
        } else {
            // ON: 낙관적으로 켜고 권한/토큰 등록 시도
            setIsNotificationEnabled(true);
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
            const success = await requestPermission();
            if (!success) {
                // 실패 시 롤백 (toast 는 requestPermission 이 이미 띄움)
                setIsNotificationEnabled(false);
                localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
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
        toast,
        dismissToast,
    };
}
