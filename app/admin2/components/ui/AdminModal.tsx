"use client";
import { memo, useCallback } from "react";
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

    return (
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
                        onClick={handleBackdrop}
                    />
                    <motion.div
                        className="relative z-10 w-[320px] rounded-2xl bg-rh-bg-surface p-6 flex flex-col gap-5"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {title && (
                            <h3 className="text-base font-semibold text-white">
                                {title}
                            </h3>
                        )}
                        <div>{children}</div>
                        {footer && <div>{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default AdminModal;
