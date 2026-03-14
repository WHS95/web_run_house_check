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

const RankingTabs: React.FC<RankingTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
}) => {
  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className='flex h-10 p-1 gap-1 rounded-rh-md bg-rh-bg-surface'>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 flex items-center justify-center rounded-rh-sm text-[13px] transition-colors duration-200
            ${
              activeTabId === tab.id
                ? "bg-rh-accent text-white font-semibold"
                : "text-rh-text-tertiary"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default RankingTabs;
