'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActiveMeetBannerVM } from '@/lib/domain/attendance/policies';
import { haptic } from '@/lib/haptic';

interface ActiveMeetBannerProps {
    meet: ActiveMeetBannerVM | null;
}

/**
 * 홈 진입 시 "지금 출석 중인 모임" 배너.
 * - VM이 null이면 렌더하지 않음
 * - localStorage에 dismissKey가 있으면 렌더하지 않음 (모임 단위 1회 닫기)
 * - 탭 시 햅틱 + /attendance로 이동
 */
const ActiveMeetBanner = memo<ActiveMeetBannerProps>(({ meet }) => {
    const [mounted, setMounted] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!meet) return;
        try {
            const stored = window.localStorage.getItem(meet.dismissKey);
            if (stored === '1') setDismissed(true);
        } catch {
            // localStorage 접근 실패는 무시 (시크릿 모드 등)
        }
    }, [meet]);

    const handleDismiss = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!meet) return;
            haptic.light();
            try {
                window.localStorage.setItem(meet.dismissKey, '1');
            } catch {
                // ignore
            }
            setDismissed(true);
        },
        [meet]
    );

    const handleTap = useCallback(() => {
        haptic.light();
    }, []);

    if (!mounted || !meet || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="px-4 pt-2"
            >
                <Link
                    href="/attendance"
                    onClick={handleTap}
                    className="flex items-center gap-3 rounded-rh-lg bg-rh-accent/15 p-3 active:opacity-80 transition-opacity"
                >
                    <span className="text-xl shrink-0" aria-hidden>
                        🏃
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white">
                            지금 출석 중인 모임이 있어요
                        </p>
                        <p className="text-xs text-rh-text-secondary truncate">
                            {meet.location} · {meet.meetingStartedLabel} 현재{' '}
                            {meet.attendeeCount}명 출석
                        </p>
                    </div>
                    <span className="flex items-center gap-1 shrink-0">
                        <span className="text-[12px] font-semibold text-rh-accent">
                            출석
                        </span>
                        <ChevronRight className="h-4 w-4 text-rh-accent" />
                    </span>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label="배너 닫기"
                        className="ml-1 -mr-1 flex h-7 w-7 items-center justify-center rounded-full text-rh-text-tertiary hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
});

ActiveMeetBanner.displayName = 'ActiveMeetBanner';

export default ActiveMeetBanner;
