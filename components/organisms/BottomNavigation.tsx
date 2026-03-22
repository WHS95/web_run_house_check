"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import NavigationIcon, {
    NavigationIconType,
} from "@/components/atoms/NavigationIcon";
import NavigationLabel from "@/components/atoms/NavigationLabel";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { haptic } from "@/lib/haptic";

const navigationItems = [
    {
        type: "home" as const,
        label: "홈",
        href: "/",
    },
    {
        type: "attendance" as const,
        label: "출석",
        href: "/attendance",
    },
    {
        type: "ranking" as const,
        label: "랭킹",
        href: "/ranking",
    },
    {
        type: "mypage" as const,
        label: "MY",
        href: "/mypage",
    },
    {
        type: "menu" as const,
        label: "메뉴",
        href: "/menu",
    },
];

/* 프리페치 대상 경로 */
const PREFETCH_ROUTES = [
    "/",
    "/attendance",
    "/ranking",
    "/mypage",
    "/menu",
    "/calculator",
    "/calculator/pace",
    "/calculator/prediction",
    "/calculator/split-time",
    "/calculator/heart-rate",
];

/* 네비게이션 실패 시 pending 상태 초기화 타임아웃 (ms) */
const PENDING_TIMEOUT = 3000;

const BottomNavigation: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { navigate } = useNavigation();

    /* 낙관적 UI를 위한 pending 상태 */
    const [pendingHref, setPendingHref] = useState<string | null>(
        null
    );
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    /* pathname이 변경되면 pending 상태 초기화 */
    useEffect(() => {
        setPendingHref(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [pathname]);

    /* 컴포넌트 언마운트 시 타이머 정리 */
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    /* 페이지 프리페치 */
    useEffect(() => {
        PREFETCH_ROUTES.forEach((route) => {
            if (
                route !== pathname &&
                (!pathname.startsWith("/calculator") ||
                    route !== pathname)
            ) {
                router.prefetch(route);
            }
        });
    }, [pathname, router]);

    /* API 프리페치 */
    useEffect(() => {
        const prefetchAPIs = async () => {
            if (pathname !== "/") {
                fetch("/api/ranking?prefetch=true", {
                    method: "GET",
                    cache: "force-cache",
                }).catch(() => {});
            }

            if (pathname !== "/ranking") {
                const currentDate = new Date();
                fetch(
                    `/api/ranking?year=${currentDate.getFullYear()}&month=${
                        currentDate.getMonth() + 1
                    }&prefetch=true`,
                    {
                        method: "GET",
                        cache: "force-cache",
                    },
                ).catch(() => {});
            }
        };

        prefetchAPIs();
    }, [pathname]);

    /* 활성 경로 판단 (pendingHref 우선) */
    const isActivePath = useCallback(
        (href: string) => {
            /* pending 상태가 있으면 해당 href를 활성으로 표시 */
            if (pendingHref !== null) {
                if (href === "/") {
                    return pendingHref === "/";
                }
                return pendingHref.startsWith(href);
            }
            if (href === "/") {
                return pathname === "/";
            }
            return pathname.startsWith(href);
        },
        [pathname, pendingHref]
    );

    /* 탭 클릭 핸들러 — 즉시 UI 반영 */
    const handleNavClick = useCallback(
        (href: string) => {
            /* 이미 현재 페이지면 무시 */
            const alreadyActive =
                href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
            if (alreadyActive) return;

            haptic.light();

            /* 낙관적 UI: 즉시 활성 탭 전환 */
            setPendingHref(href);

            /* 안전 폴백: 3초 후에도 pathname이 안 바뀌면 초기화 */
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                setPendingHref(null);
                timeoutRef.current = null;
            }, PENDING_TIMEOUT);

            /* 실제 네비게이션 수행 */
            navigate(href);
        },
        [pathname, navigate]
    );

    return (
        <nav className="ios-tab-bar">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto pt-2">
                {navigationItems.map((item) => (
                    <div key={item.type} className="relative">
                        {/* 숨겨진 프리페치 링크 */}
                        <Link
                            href={item.href}
                            prefetch={true}
                            className="hidden"
                            aria-hidden="true"
                        >
                            {item.label}
                        </Link>

                        {/* 네비게이션 아이템 */}
                        <NavItem
                            type={item.type}
                            label={item.label}
                            href={item.href}
                            isActive={isActivePath(item.href)}
                            onClick={handleNavClick}
                        />
                    </div>
                ))}
            </div>
            <div className="pb-safe" />
        </nav>
    );
};

/* 개별 네비게이션 아이템 — memo로 불필요한 리렌더 방지 */
interface NavItemProps {
    type: NavigationIconType;
    label: string;
    href: string;
    isActive: boolean;
    onClick: (href: string) => void;
}

const NavItem = React.memo<NavItemProps>(
    ({ type, label, href, isActive, onClick }) => {
        const handleClick = useCallback(
            (e: React.MouseEvent) => {
                e.preventDefault();
                onClick(href);
            },
            [onClick, href]
        );

        return (
            <button
                onClick={handleClick}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-transform duration-100 active:scale-90"
            >
                <div className="flex flex-col items-center gap-1">
                    <NavigationIcon
                        type={type}
                        isActive={isActive}
                        size={20}
                    />
                    <NavigationLabel
                        text={label}
                        isActive={isActive}
                    />
                </div>
            </button>
        );
    }
);

NavItem.displayName = "NavItem";

export default React.memo(BottomNavigation);
