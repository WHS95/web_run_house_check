import React from "react";

export interface TabItem {
    id: string;
    label: string;
}

interface RankingTabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
}

/**
 * v2 라임 카토그래픽 — 탭은 underline + 라임 강조 패턴.
 * 활성 탭: text-rh-text-primary + 하단 라임 바
 * 비활성 탭: text-rh-text-tertiary
 */
const RankingTabs: React.FC<RankingTabsProps> = ({
    tabs,
    activeTabId,
    onTabChange,
}) => {
    if (!tabs || tabs.length === 0) {
        return null;
    }

    return (
        <div
            className="flex items-stretch border-b border-rh-border"
            role="tablist"
        >
            {tabs.map((tab) => {
                const on = activeTabId === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex-1 h-11 text-[13px] transition-colors ${
                            on
                                ? "font-semibold text-rh-text-primary"
                                : "font-medium text-rh-text-tertiary"
                        }`}
                    >
                        {tab.label}
                        {on && (
                            <span
                                aria-hidden
                                className="absolute left-0 right-0 -bottom-px h-[2px] bg-rh-accent"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default RankingTabs;
