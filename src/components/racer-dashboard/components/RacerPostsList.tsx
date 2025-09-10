import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PostCard } from '../../../components/PostCard';

interface RacerPostsListProps {
  userId: string;
  reloadToken?: number;
}

// Minimal shape to satisfy PostCard rendering; we will pass through fields PostCard uses
type AnyPost = any; // Keeping broad to avoid tight coupling

export const RacerPostsList: React.FC<RacerPostsListProps> = ({ userId, reloadToken }) => {
  const [posts, setPosts] = useState<AnyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // Simplified query to avoid PGRST201 error from ambiguous relationships
        // PostCard component will handle profile data fetching as needed
        const { data, error } = await supabase
          .from('racer_posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error loading racer posts:', error);
          setPosts([]);
        } else {
          setPosts(data || []);
        }
      } catch (e) {
        console.error('Exception loading racer posts:', e);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, reloadToken]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/4" />
              </div>
            </div>
            <div className="h-64 bg-gray-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post: AnyPost) => (
        <PostCard 
          key={post.id}
          post={post}
          onPostUpdate={() => {}}
          onPostDeleted={() => {}}
        />
      ))}
    </div>
  );
};
