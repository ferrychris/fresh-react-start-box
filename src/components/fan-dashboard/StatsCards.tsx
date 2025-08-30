import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Trophy, Gift, Crown, Calendar } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, description, color }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm text-gray-400">{title}</h3>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

interface StatsCardsProps {
  supportPoints: number;
  totalTips: number;
  activeSubscriptions: number;
  activityStreak: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  supportPoints,
  totalTips,
  activeSubscriptions,
  activityStreak
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Support Points"
        value={supportPoints}
        icon={<Trophy className="h-5 w-5 text-amber-500" />}
        description="Earned through activity"
        color="bg-amber-500/20"
      />
      <StatsCard
        title="Total Tips Given"
        value={`$${totalTips}`}
        icon={<Gift className="h-5 w-5 text-green-500" />}
        description="Supporting racers"
        color="bg-green-500/20"
      />
      <StatsCard
        title="Active Subscriptions"
        value={activeSubscriptions}
        icon={<Crown className="h-5 w-5 text-blue-500" />}
        description="Monthly subscriptions"
        color="bg-blue-500/20"
      />
      <StatsCard
        title="Activity Streak"
        value={activityStreak}
        icon={<Calendar className="h-5 w-5 text-red-500" />}
        description="Days active"
        color="bg-red-500/20"
      />
    </div>
  );
};

export default StatsCards;
