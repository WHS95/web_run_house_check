"use client";

import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useModalViewportPortal } from "@/hooks/useModalViewportPortal";

export type ToastTone = "info" | "success" | "error";

interface ToastProps {
    open: boolean;
    message: string | null;
    tone?: ToastTone;
    onClose: () => void;
    autoDismissMs?: number;
}

const TONE_STYLES: Record<
    ToastTone,
    { iconColor: string; accentBorder: string }
> = {
    info: {
        iconColor: "text-rh-accent",
        accentBorder: "border-l-rh-accent",
    },
    success: {
        iconColor: "text-rh-status-success",
        accentBorder: "border-l-rh-status-success",
    },
    error: {
        iconColor: "text-rh-status-error",
        accentBorder: "border-l-rh-status-error",
    },
};

const ICONS: Record<ToastTone, LucideIcon> = {
    info: Info,
    success: CheckCircle2,
    error: AlertCircle,
};

const Toast = memo(function Toast({
    open,
    message,
    tone = "info",
    onClose,
    autoDismissMs = 4000,
}: ToastProps) {
    // .mobile-viewport 가 마운트되기 전(SSR 직후)에도 hooks 순서를 유지하기 위해
    // 항상 동일한 hook 시퀀스로 호출한다.
    const portalContainer = useModalViewportPortal(open);

    useEffect(() => {
        if (!open || autoDismissMs <= 0) return;
        const timer = window.setTimeout(onClose, autoDismissMs);
        return () => window.clearTimeout(timer);
    }, [open, autoDismissMs, onClose]);

    if (!portalContainer || !message) return null;

    const { iconColor, accentBorder } = TONE_STYLES[tone];
    const Icon = ICONS[tone];

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    role="status"
                    aria-live="polite"
                    className={`absolute left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[120] rounded-rh-lg bg-rh-bg-surface border border-rh-border border-l-4 ${accentBorder} shadow-lg`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className="flex items-start gap-3 px-4 py-3">
                        <Icon
                            size={18}
                            className={`shrink-0 mt-0.5 ${iconColor}`}
                        />
                        <p className="flex-1 text-sm text-white whitespace-pre-line break-keep">
                            {message}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="닫기"
                            className="shrink-0 -mr-1 -mt-1 p-1 text-rh-text-muted active:opacity-70"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalContainer
    );
});

export default Toast;
