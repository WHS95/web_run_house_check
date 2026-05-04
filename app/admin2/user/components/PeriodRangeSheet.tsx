"use client";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModalViewportPortal } from "@/hooks/useModalViewportPortal";

interface Props {
    open: boolean;
    onClose: () => void;
    initialFrom: string | null; // YYYY-MM-DD
    initialTo: string | null; // YYYY-MM-DD
    onApply: (range: { from: string; to: string }) => void;
}

const todayYmd = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const daysAgoYmd = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const PeriodRangeSheet = memo(function PeriodRangeSheet({
    open,
    onClose,
    initialFrom,
    initialTo,
    onApply,
}: Props) {
    const [from, setFrom] = useState<string>(
        initialFrom ?? daysAgoYmd(30)
    );
    const [to, setTo] = useState<string>(initialTo ?? todayYmd());
    const portalContainer = useModalViewportPortal(open);

    useEffect(() => {
        if (open) {
            setFrom(initialFrom ?? daysAgoYmd(30));
            setTo(initialTo ?? todayYmd());
        }
    }, [open, initialFrom, initialTo]);

    if (!portalContainer) return null;

    const invalid = !from || !to || from > to;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className='absolute inset-0 z-[100] flex flex-col justify-end'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className='absolute inset-0 bg-black/50'
                        onClick={onClose}
                    />
                    <motion.div
                        className='relative z-10 flex flex-col gap-5 bg-rh-bg-surface rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]'
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                    >
                        {/* 드래그 핸들 */}
                        <div className='flex justify-center -mt-2'>
                            <div className='w-10 h-1 rounded-full bg-rh-bg-muted' />
                        </div>

                        <div className='space-y-1'>
                            <h3 className='text-center text-base font-semibold text-white'>
                                기간 직접 선택
                            </h3>
                            <p className='text-center text-[12px] text-rh-text-tertiary'>
                                선택한 기간 내 출석 횟수로 회원을 조회합니다.
                            </p>
                        </div>

                        <div className='flex flex-col gap-3'>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[12px] font-medium text-rh-text-secondary px-1'>
                                    시작일
                                </label>
                                <input
                                    type='date'
                                    value={from}
                                    max={to || undefined}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className='ios-date-input'
                                />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[12px] font-medium text-rh-text-secondary px-1'>
                                    종료일
                                </label>
                                <input
                                    type='date'
                                    value={to}
                                    min={from || undefined}
                                    max={todayYmd()}
                                    onChange={(e) => setTo(e.target.value)}
                                    className='ios-date-input'
                                />
                            </div>
                        </div>

                        {invalid && (
                            <p className='text-[12px] text-rh-status-warning text-center'>
                                시작일은 종료일보다 이전이어야 합니다.
                            </p>
                        )}

                        <button
                            type='button'
                            disabled={invalid}
                            onClick={() => onApply({ from, to })}
                            className='w-full h-12 rounded-xl bg-rh-accent text-white text-sm font-semibold disabled:opacity-50'
                        >
                            적용
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalContainer
    );
});

export default PeriodRangeSheet;
