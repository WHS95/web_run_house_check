"use client";
import { memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModalViewportPortal } from "@/hooks/useModalViewportPortal";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    icon?: React.ReactNode;
    title: string;
    description?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    confirmVariant?: "primary" | "danger";
    confirmDisabled?: boolean;
}

const ConfirmDialog = memo(function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    icon,
    title,
    description,
    cancelLabel = "취소",
    confirmLabel = "확인",
    confirmVariant = "primary",
    confirmDisabled = false,
}: ConfirmDialogProps) {
    const portalContainer = useModalViewportPortal(open);
    if (!portalContainer) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative z-10 w-[300px] rounded-2xl bg-rh-bg-surface p-6 flex flex-col items-center gap-5"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {icon}
                        <p className="text-base font-semibold text-white">
                            {title}
                        </p>
                        {description && (
                            <p className="text-sm text-rh-text-secondary text-center whitespace-pre-line">
                                {description}
                            </p>
                        )}
                        <div className="flex w-full gap-2">
                            <button
                                className="flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-medium"
                                onClick={onClose}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                disabled={confirmDisabled}
                                className={`flex-1 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 ${
                                    confirmVariant === "danger"
                                        ? "bg-rh-status-error"
                                        : "bg-rh-accent"
                                }`}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalContainer
    );
});

export default ConfirmDialog;
