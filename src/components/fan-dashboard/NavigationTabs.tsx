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
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-6">
      <div className="flex overflow-x-auto scrollbar-thin bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 sm:px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg transform scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationTabs;
