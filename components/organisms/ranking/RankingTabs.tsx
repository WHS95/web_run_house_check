import React from "react";
interface RankingTabsProps {
  tabs: string[];
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

const RankingTabs: React.FC<RankingTabsProps> = ({
  tabs,
  initialTab,
  onTabChange,
}) => {
  // tabs 배열이 비어있지 않은지 확인하고, initialTab이 없을 경우 첫 번째 탭을 사용
  const defaultTab = tabs.length > 0 ? tabs[0] : "";
  const [activeTab, setActiveTab] = React.useState<string>(
    initialTab || defaultTab
  );

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // tabs 배열이 비어있으면 아무것도 렌더링하지 않음
  if (!tabs.length) {
    return null;
  }

  return (
    <div className='bg-[#192642] rounded-lg p-1 flex mb-6'>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          className={`flex-1 py-2 rounded-t-md text-sm font-medium transition-colors duration-200 
            ${
              activeTab === tab
                ? "bg-primary-blue text-white shadow-md"
                : "text-white/40"
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default RankingTabs;
