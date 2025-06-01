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
    <div className='bg-[#192642] rounded-lg p-1 flex mb-6'>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 
            ${
              activeTabId === tab.id
                ? "bg-white text-[#192642] shadow-lg font-semibold transform scale-[1.02]"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
