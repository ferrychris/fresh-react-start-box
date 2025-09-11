import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Award, Crown, MessageSquare } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
  timestamp: string;
  timeAgo: string;
  content: string;
  metadata: {
    racerId?: string;
    racerName?: string;
    amount?: number;
    badgeName?: string;
    postId?: string;
    postContent?: string;
    commentContent?: string;
    likes?: number;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAllActivity: () => void;
  loading: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAllActivity, loading }) => {
  // Theme context available if needed for future styling

  // Normalize inputs to prevent runtime errors on unexpected values
  const safeActivities: ActivityItem[] = Array.isArray(activities) ? activities : [];
  const isLoading = Boolean(loading);
  const handleViewAll = typeof onViewAllActivity === 'function' ? onViewAllActivity : () => {};

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-4 w-1/3 bg-gray-800 rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-gray-800 rounded" />
                <div className="h-3 w-1/2 bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <div className="h-8 w-1/3 mx-auto bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'badge':
        return <Award className="h-5 w-5 text-amber-500" />;
      case 'subscription':
        return <Crown className="h-5 w-5 text-purple-500" />;
      case 'post':
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Heart className="h-5 w-5 text-red-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'tip':
        return 'bg-red-500/20';
      case 'badge':
        return 'bg-amber-500/20';
      case 'subscription':
        return 'bg-purple-500/20';
      case 'post':
      case 'comment':
        return 'bg-blue-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    const m = activity?.metadata || {};
    switch (activity.type) {
      case 'tip':
        return (
          <div>
            <p className="text-white">
              Tipped <Link to={`/racer/${m.racerId ?? ''}`} className="text-green-500 hover:underline">
                {m.racerName ?? 'Racer'}
              </Link> <span className="text-green-500">${m.amount ?? 0}</span>
            </p>
            {activity.content && <p className="text-gray-400 text-sm mt-1">{activity.content}</p>}
          </div>
        );
      case 'badge':
        return (
          <div>
            <p className="text-white">
              Earned badge: <span className="text-amber-500">{m.badgeName ?? ''}</span>
            </p>
            {activity.content && <p className="text-gray-400 text-sm mt-1">{activity.content}</p>}
          </div>
        );
      case 'subscription':
        return (
          <div>
            <p className="text-white">
              Subscribed to <Link to={`/racer/${m.racerId ?? ''}`} className="text-green-500 hover:underline">
                {m.racerName ?? 'Racer'}
              </Link>
            </p>
            {activity.content && <p className="text-gray-400 text-sm mt-1">{activity.content}</p>}
          </div>
        );
      case 'post':
        return (
          <div>
            <p className="text-white">
              Posted: <span className="text-gray-300">"{m.postContent ?? ''}"</span>
            </p>
            {typeof m.likes === 'number' && m.likes > 0 && (
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <Heart className="h-3 w-3" /> {m.likes} likes
              </div>
            )}
          </div>
        );
      case 'comment':
        return (
          <div>
            <p className="text-white">
              Commented on <Link to={`/racer/${m.racerId ?? ''}`} className="text-green-500 hover:underline">
                {m.racerName ?? 'Racer'}
              </Link>'s post
            </p>
            <p className="text-gray-400 text-sm mt-1">"{m.commentContent ?? ''}"</p>
          </div>
        );
      default:
        return <p className="text-white">{activity.content}</p>;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
      
      <div className="space-y-4">
        {safeActivities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1">
              {renderActivityContent(activity)}
              <div className="text-xs text-gray-500 mt-1">{activity.timeAgo}</div>
            </div>
          </div>
        ))}
      </div>
      
      {safeActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No recent activity to display.</p>
        </div>
      )}
      
      {safeActivities.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleViewAll}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
