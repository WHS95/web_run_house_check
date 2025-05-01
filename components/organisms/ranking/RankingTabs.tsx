import React from "react";

const RankingTabs: React.FC = () => {
  // TODO: 탭 선택 및 활성화 상태 관리 필요
  const tabs = ["종합", "참여", "개설"];
  const activeTab = "종합"; // 기본 활성 탭

  return (
    <div className='bg-[#192642] rounded-lg p-1 flex mb-6'>
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200 
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
