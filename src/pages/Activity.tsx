import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase/client';
import { Heart, Award, Crown, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FanActivityRow {
  id: string;
  fan_id: string;
  activity_type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
  created_at: string;
  content?: string | null;
  racer_id?: string | null;
  racer_name?: string | null;
  amount?: number | null;
  badge_name?: string | null;
  post_id?: string | null;
  post_content?: string | null;
  comment_content?: string | null;
  likes?: number | null;
}

const PAGE_SIZE = 10;

const Activity: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<FanActivityRow[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const lastSeenKey = useMemo(() => user?.id ? `activity_last_seen_${user.id}` : '', [user?.id]);

  const getTimeAgo = useCallback((date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.max(0, Math.floor(seconds))}s`;
  }, []);

  const fetchPage = useCallback(async (pageIndex: number) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('fan_activity')
        .select('*')
        .eq('fan_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const newRows = (data as FanActivityRow[]) || [];
      setRows(prev => pageIndex === 0 ? newRows : [...prev, ...newRows]);
      setHasMore(newRows.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // initial load
    setPage(0);
    fetchPage(0);
    // mark last seen for unread behavior
    if (lastSeenKey) localStorage.setItem(lastSeenKey, new Date().toISOString());
  }, [fetchPage, lastSeenKey]);

  const loadMore = async () => {
    const next = page + 1;
    setPage(next);
    await fetchPage(next);
  };

  const getIcon = (type: FanActivityRow['activity_type']) => {
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-4">Your Activity</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {rows.length === 0 && !loading && (
          <div className="p-6 text-gray-400">No activity yet.</div>
        )}
        {rows.map((a) => (
          <div key={a.id} className="px-5 py-4 flex gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800/60">
              {getIcon(a.activity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {a.activity_type === 'tip' && (
                  <>Tipped <span className="text-green-500">{a.racer_name || 'Racer'}</span> <span className="text-green-500">${a.amount || 0}</span></>
                )}
                {a.activity_type === 'badge' && (
                  <>Earned badge <span className="text-amber-500">{a.badge_name || ''}</span></>
                )}
                {a.activity_type === 'subscription' && (
                  <>Subscribed to <span className="text-purple-400">{a.racer_name || 'Racer'}</span></>
                )}
                {a.activity_type === 'post' && (
                  <>Posted: <span className="text-gray-300">"{a.post_content || ''}"</span></>
                )}
                {a.activity_type === 'comment' && (
                  <>Commented: <span className="text-gray-300">"{a.comment_content || ''}"</span></>
                )}
                {!['tip','badge','subscription','post','comment'].includes(a.activity_type) && (
                  <>{a.content || 'Activity'}</>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">{getTimeAgo(new Date(a.created_at))} ago</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="p-4 text-sm text-gray-400">Loading...</div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      <div className="mt-6 text-right">
        <Link to="/fan-dashboard" className="text-fedex-orange hover:underline text-sm">Back to dashboard</Link>
      </div>
    </div>
  );
};

export default Activity;
