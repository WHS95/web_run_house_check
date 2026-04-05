"use client";
import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const AdminModal = memo(function AdminModal({
    open,
    onClose,
    title,
    children,
    footer,
}: AdminModalProps) {
    const handleBackdrop = useCallback(() => {
        onClose();
    }, [onClose]);

    // 포털 마운트: SSR 시 document가 없으므로 클라이언트에서만 활성화
    const [mounted, setMounted] = useState(false);
    const [container, setContainer] =
        useState<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        // mobile-viewport를 포털 타겟으로 사용 (없으면 body)
        const target =
            (document.querySelector(
                ".mobile-viewport",
            ) as HTMLElement | null) || document.body;
        setContainer(target);
    }, []);

    // 모달 열림 시 배경 스크롤 방지
    useEffect(() => {
        if (!open) return;
        const main = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        const prev = main?.style.overflow;
        if (main) main.style.overflow = "hidden";
        return () => {
            if (main) main.style.overflow = prev || "";
        };
    }, [open]);

    if (!mounted || !container) return null;

    const modal = (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={handleBackdrop}
                    />
                    <motion.div
                        className="relative z-10 w-full max-w-[320px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-rh-bg-surface p-6 flex flex-col gap-5"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {title && (
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-white">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-rh-text-secondary"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                        <div>{children}</div>
                        {footer && <div>{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modal, container);
});

export default AdminModal;
