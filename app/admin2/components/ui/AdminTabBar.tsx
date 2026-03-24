"use client";
import { memo, useCallback } from "react";
import { haptic } from "@/lib/haptic";

interface Tab {
    key: string;
    label: string;
}

interface AdminTabBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

const AdminTabBar = memo(function AdminTabBar({
    tabs,
    activeTab,
    onTabChange,
}: AdminTabBarProps) {
    const handleTab = useCallback(
        (key: string) => {
            haptic.light();
            onTabChange(key);
        },
        [onTabChange],
    );

    return (
        <div className="flex h-10 gap-1 p-1 rounded-lg bg-rh-bg-surface">
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <button
                        key={tab.key}
                        className={`flex-1 flex items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                            isActive
                                ? "bg-rh-accent text-white"
                                : "text-rh-text-secondary"
                        }`}
                        onClick={() => handleTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
});

export default AdminTabBar;
