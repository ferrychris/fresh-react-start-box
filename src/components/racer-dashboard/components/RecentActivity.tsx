import React, { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface RecentActivityProps {
  userId: string;
}

interface ActivityItem {
  id: string;
  type: 'tip' | 'subscription' | 'milestone';
  fanName?: string;
  amount?: number;
  tier?: string;
  description?: string;
  timestamp: string;
  icon: string;
  created_at: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch tips
        const { data: tips, error: tipsError } = await supabase
          .from('tips')
          .select('id, amount, created_at, fan:fan_id(name)')
          .eq('racer_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (tipsError) {
          console.error('Error fetching tips:', tipsError);
        }
        
        // Fetch subscriptions
        const { data: subscriptions, error: subsError } = await supabase
          .from('subscriptions')
          .select('id, tier_name, created_at, fan:fan_id(name)')
          .eq('racer_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (subsError) {
          console.error('Error fetching subscriptions:', subsError);
        }
        
        // Fetch milestones (could be from a separate table or calculated)
        const { data: milestones, error: milestonesError } = await supabase
          .from('racer_milestones')
          .select('id, description, created_at')
          .eq('racer_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (milestonesError && milestonesError.code !== 'PGRST116') {
          console.error('Error fetching milestones:', milestonesError);
        }
        
        // Transform and combine the data
        const formattedTips = (tips || []).map(tip => ({
          id: `tip-${tip.id}`,
          type: 'tip' as const,
          fanName: tip.fan?.name || 'Anonymous Fan',
          amount: tip.amount / 100, // Assuming amount is stored in cents
          timestamp: formatTimestamp(tip.created_at),
          icon: '💰',
          created_at: tip.created_at
        }));
        
        const formattedSubscriptions = (subscriptions || []).map(sub => ({
          id: `sub-${sub.id}`,
          type: 'subscription' as const,
          fanName: sub.fan?.name || 'Anonymous Fan',
          tier: sub.tier_name || 'Fan',
          timestamp: formatTimestamp(sub.created_at),
          icon: '👑',
          created_at: sub.created_at
        }));
        
        const formattedMilestones = (milestones || []).map(milestone => ({
          id: `milestone-${milestone.id}`,
          type: 'milestone' as const,
          description: milestone.description || 'New milestone reached',
          timestamp: formatTimestamp(milestone.created_at),
          icon: '🏆',
          created_at: milestone.created_at
        }));
        
        // Combine and sort by date
        const allActivities = [...formattedTips, ...formattedSubscriptions, ...formattedMilestones]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setActivities(allActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Fallback to mock data if there's an error
        setActivities(getMockActivity());
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [userId]);

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Fallback mock data
  const getMockActivity = (): ActivityItem[] => [
    {
      id: '1',
      type: 'tip',
      fanName: 'Mike Johnson',
      amount: 15,
      timestamp: '2 hours ago',
      icon: '💰',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'subscription',
      fanName: 'Sarah Williams',
      tier: 'Crew Chief',
      timestamp: '1 day ago',
      icon: '👑',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      type: 'milestone',
      description: '500 Followers Reached',
      timestamp: '3 days ago',
      icon: '🏆',
      created_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        <Bell className="w-5 h-5 text-slate-400" />
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl">
                {activity.icon}
              </div>
              <div className="flex-1">
                {activity.type === 'tip' && (
                  <p className="text-slate-300">
                    <span className="font-semibold text-blue-400">{activity.fanName}</span> tipped you
                    <span className="font-bold text-green-400"> ${activity.amount}</span>
                  </p>
                )}
                {activity.type === 'subscription' && (
                  <p className="text-slate-300">
                    <span className="font-semibold text-blue-400">{activity.fanName}</span> subscribed at
                    <span className="font-bold text-purple-400"> {activity.tier}</span> tier
                  </p>
                )}
                {activity.type === 'milestone' && (
                  <p className="text-slate-300">
                    <span className="font-bold text-yellow-400">Milestone:</span> {activity.description}
                  </p>
                )}
                <p className="text-xs text-slate-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400">
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
      <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
        View All Activity
      </button>
    </div>
  );
};
