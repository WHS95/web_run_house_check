"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, X } from "lucide-react";
import { CrewLocation } from "@/lib/types/crew-locations";

interface MapBottomSheetProps {
    location: CrewLocation | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function MapBottomSheet({
    location,
    isOpen,
    onClose,
}: MapBottomSheetProps) {
    if (!location) return null;

    // 네이버 지도 길찾기 딥링크
    const handleDirections = () => {
        const naverMapUrl = `nmap://route/walk?dlat=${location.latitude}&dlng=${location.longitude}&dname=${encodeURIComponent(location.name)}`;
        const webFallback = `https://map.naver.com/v5/directions/-/-/-/walk?c=${location.longitude},${location.latitude},15,0,0,0,dh`;

        // 앱이 없으면 웹으로 fallback
        const timeout = setTimeout(() => {
            window.location.href = webFallback;
        }, 1500);

        window.location.href = naverMapUrl;

        // 앱이 열리면 타이머 취소
        window.addEventListener(
            "blur",
            () => {
                clearTimeout(timeout);
            },
            { once: true }
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-30 bg-rh-bg-primary/40"
                        onClick={onClose}
                    />

                    {/* 바텀시트 */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 28,
                            stiffness: 300,
                        }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl bg-rh-bg-surface pb-safe"
                    >
                        {/* 드래그 핸들 */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1 w-10 rounded-full bg-rh-bg-muted" />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-start justify-between px-5 pb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {location.name}
                                    </h3>
                                    {location.is_active && (
                                        <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rh-accent/20 text-rh-accent">
                                            활성
                                        </span>
                                    )}
                                </div>
                                {location.description && (
                                    <p className="mt-1 text-sm text-rh-text-secondary leading-relaxed">
                                        {location.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="shrink-0 ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-rh-bg-muted"
                            >
                                <X className="h-4 w-4 text-rh-text-secondary" />
                            </button>
                        </div>

                        {/* 길찾기 버튼 */}
                        <div className="px-5 pb-5">
                            <button
                                onClick={handleDirections}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rh-accent py-3.5 text-white font-semibold text-[15px] active:bg-rh-accent-hover transition-colors"
                            >
                                <Navigation className="h-4.5 w-4.5" />
                                네이버 지도에서 길찾기
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
