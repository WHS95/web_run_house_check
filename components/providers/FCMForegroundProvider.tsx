"use client";

import { useEffect, useState, useCallback } from "react";
import { onForegroundMessage } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

interface ForegroundNotification {
    title: string;
    body: string;
}

export default function FCMForegroundProvider() {
    const [notification, setNotification] =
        useState<ForegroundNotification | null>(null);

    const handleClose = useCallback(() => {
        setNotification(null);
    }, []);

    useEffect(() => {
        const unsubscribe = onForegroundMessage(
            (payload: unknown) => {
                const p = payload as {
                    notification?: { title?: string; body?: string };
                };
                if (p?.notification) {
                    setNotification({
                        title: p.notification.title || "런하우스",
                        body:
                            p.notification.body ||
                            "새로운 알림이 있습니다.",
                    });
                }
            }
        );
        return () => unsubscribe?.();
    }, []);

    // 자동 닫기
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(handleClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, handleClose]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    className="fixed top-4 left-4 right-4 z-[9999] cursor-pointer"
                    onClick={handleClose}
                >
                    <div className="rounded-rh-lg bg-rh-bg-surface border border-rh-border p-4 shadow-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rh-accent/20">
                                <Bell className="h-4 w-4 text-rh-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-rh-body font-semibold text-white truncate">
                                    {notification.title}
                                </p>
                                <p className="text-rh-caption text-rh-text-secondary mt-0.5 line-clamp-2">
                                    {notification.body}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
