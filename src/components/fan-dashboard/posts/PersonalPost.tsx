import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPostsForFan, createFanPost } from '../../../lib/supabase/posts';
import { PostCard } from '../../PostCard';
import { useUser } from '@/contexts/UserContext';
import type { Post as CorePost } from '@/types';

// Minimal DB row type for mapping to CorePost
type DbPostRow = {
  id: string;
  racer_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string | null;
  content?: string | null;
  post_type?: string | null;
  media_urls?: string[] | null;
  visibility?: 'public' | 'fans_only' | null | string;
  likes_count?: number | null;
  comments_count?: number | null;
  total_tips?: number | null;
  allow_tips?: boolean | null;
  user_type?: string | null;
  profiles?: {
    id: string;
    email?: string | null;
    name: string;
    user_type: string;
    avatar?: string | null;
  } | null;
};

interface PersonalPostProps {
  fanId?: string;
}

const PersonalPost: React.FC<PersonalPostProps> = ({ fanId }) => {
  const route = useParams<{ id: string }>();
  const targetFanId = fanId || route.id || '';

  const [posts, setPosts] = useState<CorePost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [composerText, setComposerText] = useState<string>('');
  const [posting, setPosting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!targetFanId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getPostsForFan(targetFanId);
        // Map DB rows to CorePost expected by PostCard
        const mapped: CorePost[] = (data as DbPostRow[] | null || []).map((p) => ({
          id: p.id,
          racer_id: p.racer_id ?? undefined,
          user_id: p.user_id,
          created_at: p.created_at,
          updated_at: p.updated_at ?? undefined,
          content: p.content ?? '',
          post_type: (p.post_type as CorePost['post_type']) || 'text',
          media_urls: Array.isArray(p.media_urls) ? p.media_urls as string[] : [],
          visibility: p.visibility === 'fans_only' ? 'fans_only' : 'public',
          likes_count: p.likes_count ?? 0,
          comments_count: p.comments_count ?? 0,
          total_tips: p.total_tips ?? 0,
          allow_tips: Boolean(p.allow_tips),
          user_type: p.user_type as CorePost['user_type'],
          profiles: p.profiles ? {
            id: p.profiles.id,
            email: p.profiles.email ?? undefined,
            name: p.profiles.name,
            user_type: p.profiles.user_type,
            avatar: p.profiles.avatar ?? undefined,
          } : undefined,
        }));
        setPosts(mapped);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load posts';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetFanId]);

  const isOwnProfile = Boolean(user?.id && targetFanId && user.id === targetFanId);

  const handleCreatePost = async () => {
    if (!isOwnProfile) {
      setError('You can only post on your own profile.');
      return;
    }
    if (!composerText.trim()) return;

    setPosting(true);
    setError(null);
    try {
      await createFanPost({
        fan_id: targetFanId,
        content: composerText.trim(),
        media_urls: [],
        post_type: 'text',
        visibility: 'public',
      });
      setComposerText('');
      // Reload posts to include the new one
      const data = await getPostsForFan(targetFanId);
      const mapped: CorePost[] = (data as DbPostRow[] | null || []).map((p) => ({
        id: p.id,
        racer_id: p.racer_id ?? undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.updated_at ?? undefined,
        content: p.content ?? '',
        post_type: (p.post_type as CorePost['post_type']) || 'text',
        media_urls: Array.isArray(p.media_urls) ? p.media_urls as string[] : [],
        visibility: p.visibility === 'fans_only' ? 'fans_only' : 'public',
        likes_count: p.likes_count ?? 0,
        comments_count: p.comments_count ?? 0,
        total_tips: p.total_tips ?? 0,
        allow_tips: Boolean(p.allow_tips),
        user_type: p.user_type as CorePost['user_type'],
        profiles: p.profiles ? {
          id: p.profiles.id,
          email: p.profiles.email ?? undefined,
          name: p.profiles.name,
          user_type: p.profiles.user_type,
          avatar: p.profiles.avatar ?? undefined,
        } : undefined,
      }));
      setPosts(mapped);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create post';
      setError(msg);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-0 py-2">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-fedex-orange to-red-500">
          My Posts
        </span>
      </h1>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Composer - only on own profile */}
        {isOwnProfile && (
          <div className="bg-gray-900 rounded-xl p-4 lg:p-5">
            <h2 className="text-lg font-semibold mb-3">Create a post</h2>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              rows={3}
              placeholder="Share an update with your followers..."
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleCreatePost}
                disabled={posting || !composerText.trim()}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
                  posting || !composerText.trim()
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-4 border-fedex-orange/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-fedex-orange rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-fedex-orange/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏁</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400">Loading posts...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, visibleCount).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">🏁</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-sm text-gray-400">You haven’t posted anything yet.</p>
          </div>
        )}

        {/* Load More */}
        {!loading && posts.length > visibleCount && (
          <div className="text-center py-4">
            <button
              className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-all duration-200"
              onClick={() => setVisibleCount((c) => c + 10)}
            >
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalPost;