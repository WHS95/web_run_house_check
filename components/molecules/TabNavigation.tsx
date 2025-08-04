'use client';

import React from 'react';

interface TabItem {
    id: string;
    label: string;
}

interface TabNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
    tabs, 
    activeTab, 
    onTabChange, 
    className = '' 
}) => {
    return (
        <div className={`flex bg-basic-black-gray rounded-[1rem] p-[1vw] mb-[3vh] ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-[1.5vh] rounded-[0.75rem] text-[0.875rem] font-medium transition-all duration-200 ${
                        activeTab === tab.id
                            ? 'bg-white text-basic-black shadow-sm'
                            : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabNavigation;