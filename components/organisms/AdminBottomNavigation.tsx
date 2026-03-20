"use client";

import React, { memo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarCheck,
    Users,
    ArrowRightLeft,
    Menu,
} from "lucide-react";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { haptic } from "@/lib/haptic";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface AdminNavItem {
    label: string;
    href: string | null;
    icon: LucideIcon;
    matchExact?: boolean;
    isSwitch?: boolean;
}

const adminNavItems: AdminNavItem[] = [
    {
        label: "대시보드",
        href: "/admin2",
        icon: LayoutDashboard,
        matchExact: true,
    },
    {
        label: "출석",
        href: "/admin2/attendance",
        icon: CalendarCheck,
    },
    {
        label: "회원",
        href: "/admin2/user",
        icon: Users,
    },
    {
        label: "전환",
        href: null,
        icon: ArrowRightLeft,
        isSwitch: true,
    },
    {
        label: "메뉴",
        href: "/admin2/menu",
        icon: Menu,
    },
];

const AdminBottomNavigation: React.FC = memo(
    function AdminBottomNavigation() {
        const pathname = usePathname();
        const { navigate } = useNavigation();
        const [showExitModal, setShowExitModal] = useState(false);

        const isActive = useCallback(
            (item: AdminNavItem) => {
                if (item.isSwitch) return false;
                if (!item.href) return false;
                if (item.matchExact) return pathname === item.href;
                return pathname.startsWith(item.href);
            },
            [pathname],
        );

        const handleTabClick = useCallback(
            (item: AdminNavItem) => {
                haptic.light();
                if (item.isSwitch) {
                    setShowExitModal(true);
                    return;
                }
                if (item.href) {
                    navigate(item.href);
                }
            },
            [navigate],
        );

        const handleExitConfirm = useCallback(() => {
            setShowExitModal(false);
            navigate("/");
        }, [navigate]);

        return (
            <>
                <nav className="ios-tab-bar">
                    <div className="flex items-center justify-around h-16 max-w-md mx-auto pt-2">
                        {adminNavItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            const isSwitch = item.isSwitch;
                            return (
                                <button
                                    key={item.label}
                                    className="flex flex-col items-center gap-1"
                                    onClick={() =>
                                        handleTabClick(item)
                                    }
                                >
                                    <Icon
                                        size={22}
                                        className={
                                            isSwitch
                                                ? "text-rh-status-warning"
                                                : active
                                                  ? "text-rh-accent"
                                                  : "text-rh-text-tertiary"
                                        }
                                    />
                                    <span
                                        className={`text-[10px] ${
                                            isSwitch
                                                ? "font-medium text-rh-status-warning"
                                                : active
                                                  ? "font-semibold text-rh-accent"
                                                  : "font-medium text-rh-text-tertiary"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="pb-safe" />
                </nav>

                <AnimatePresence>
                    {showExitModal && (
                        <motion.div
                            className="fixed inset-0 z-[100] flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div
                                className="absolute inset-0 bg-black/50"
                                onClick={() =>
                                    setShowExitModal(false)
                                }
                            />
                            <motion.div
                                className="relative z-10 w-[300px] rounded-2xl bg-rh-bg-surface p-6 flex flex-col items-center gap-5"
                                initial={{
                                    scale: 0.9,
                                    opacity: 0,
                                }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                }}
                                exit={{
                                    scale: 0.9,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor:
                                            "#5580C033",
                                    }}
                                >
                                    <ArrowRightLeft
                                        size={24}
                                        className="text-rh-status-warning"
                                    />
                                </div>
                                <p className="text-base font-semibold text-white">
                                    관리자 모드를
                                    종료하시겠습니까?
                                </p>
                                <p className="text-sm text-rh-text-secondary">
                                    일반 모드로
                                    돌아갑니다
                                </p>
                                <div className="flex w-full gap-2">
                                    <button
                                        className="flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-medium"
                                        onClick={() =>
                                            setShowExitModal(
                                                false,
                                            )
                                        }
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="flex-1 py-3 rounded-xl bg-rh-accent text-white text-sm font-medium"
                                        onClick={
                                            handleExitConfirm
                                        }
                                    >
                                        종료
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    },
);

export default AdminBottomNavigation;
