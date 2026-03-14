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
    <div className='flex p-[0.25rem] mb-6 rounded-lg bg-rh-bg-surface'>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 py-2 rounded-md text-[0.875rem] font-medium transition-all duration-200 
            ${
              activeTabId === tab.id
                ? "bg-rh-accent text-white shadow-lg font-semibold"
                : "text-rh-text-tertiary hover:text-white/80 hover:bg-white/5"
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
