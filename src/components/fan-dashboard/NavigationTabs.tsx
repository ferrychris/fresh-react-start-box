import React from 'react';

interface NavigationTab {
  id: string;
  label: string;
  count?: number;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  // theme not used here; removed to avoid lint warnings

  return (
    <div className="flex border-b border-gray-800 mx-[50px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-white border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs;
