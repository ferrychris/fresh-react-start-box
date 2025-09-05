import React from 'react';
import { TrendingUp, Calendar, Star, DollarSign, LucideIcon } from 'lucide-react';

interface Tab {
  id: 'overview' | 'activity' | 'content' | 'monetization';
  label: string;
  icon: LucideIcon;
}

interface DashboardNavigationProps {
  activeTab: 'overview' | 'activity' | 'content' | 'monetization';
  setActiveTab: (tab: 'overview' | 'activity' | 'content' | 'monetization') => void;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({ 
  activeTab, 
  setActiveTab 
}) => {
  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Calendar },
    { id: 'content', label: 'Content', icon: Star },
    { id: 'monetization', label: 'Monetization', icon: DollarSign }
  ];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
