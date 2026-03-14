"use client";

import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PushPermissionBannerProps {
    onAllow: () => void;
    onDismiss: () => void;
    show: boolean;
}

export default function PushPermissionBanner({
    onAllow,
    onDismiss,
    show,
}: PushPermissionBannerProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-4 mt-3 rounded-rh-lg bg-rh-bg-surface p-4 border border-rh-border"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rh-accent/20">
                            <Bell className="h-5 w-5 text-rh-accent" />
                        </div>
                        <div className="flex-1">
                            <p className="text-rh-body font-medium text-white">
                                알림을 켜보세요
                            </p>
                            <p className="mt-1 text-rh-caption text-rh-text-secondary">
                                출석 현황과 공지사항을 바로 받을 수
                                있어요
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={onAllow}
                                    className="rounded-rh-md bg-rh-accent px-4 py-2 text-rh-caption font-semibold text-white"
                                >
                                    허용
                                </button>
                                <button
                                    onClick={onDismiss}
                                    className="rounded-rh-md px-4 py-2 text-rh-caption text-rh-text-secondary"
                                >
                                    나중에
                                </button>
                            </div>
                        </div>
                        <button onClick={onDismiss}>
                            <X className="h-4 w-4 text-rh-text-muted" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
