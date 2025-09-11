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
    <div className="mx-0 sm:mx-6 lg:mx-8 mt-2 sm:mt-6">
      <div className="flex justify-between sm:justify-start w-full px-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-1 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap border-b-2 flex-1 sm:flex-none ${
              activeTab === tab.id
                ? 'text-orange-500 border-orange-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:border-gray-700'
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
