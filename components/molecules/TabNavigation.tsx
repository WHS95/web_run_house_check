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
        <div className={`flex bg-rh-bg-surface rounded-rh-xl p-1 mb-6 ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-1.5 rounded-rh-lg text-[0.875rem] font-medium transition-all duration-200 ${
                        activeTab === tab.id
                            ? 'bg-white text-rh-text-inverted shadow-sm'
                            : 'text-rh-text-secondary hover:text-rh-text-secondary'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabNavigation;