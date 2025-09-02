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
  return (
    <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-6 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-2 tracking-tight">{value}</div>
      <p className="text-sm text-gray-400">{description}</p>
      
      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Support Points"
        value={supportPoints.toLocaleString()}
        icon={<Trophy className="h-6 w-6 text-amber-400" />}
        description="Earned through fan activities"
        color="bg-gradient-to-br from-amber-500/20 to-yellow-500/20"
      />
      <StatsCard
        title="Total Tips Given"
        value={`$${totalTips.toLocaleString()}`}
        icon={<Gift className="h-6 w-6 text-green-400" />}
        description="Supporting your favorite racers"
        color="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
      />
      <StatsCard
        title="Active Subscriptions"
        value={activeSubscriptions}
        icon={<Crown className="h-6 w-6 text-blue-400" />}
        description="Premium racer subscriptions"
        color="bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
      />
      <StatsCard
        title="Activity Streak"
        value={`${activityStreak} days`}
        icon={<Calendar className="h-6 w-6 text-red-400" />}
        description="Consecutive days active"
        color="bg-gradient-to-br from-red-500/20 to-pink-500/20"
      />
    </div>
  );
};

export default StatsCards;
