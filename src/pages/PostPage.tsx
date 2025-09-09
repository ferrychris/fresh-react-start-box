import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { PostCard, type Post as PostCardType } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import { AuthModal } from '@/components/auth/AuthModal';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [post, setPost] = useState<PostCardType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      if (!id) { setError('Invalid post id'); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('racer_posts')
          .select(`
            id,
            created_at,
            content,
            media_urls,
            post_type,
            visibility,
            likes_count,
            upvotes_count,
            comments_count,
            total_tips,
            allow_tips,
            user_id,
            user_type,
            racer_id,
            profiles!racer_posts_user_id_fkey (id, name, email, avatar, banner_image, user_type, is_verified),
            racer_profiles!racer_posts_racer_id_fkey (id, username, profile_photo_url, banner_photo_url, car_number, racing_class, team_name, profiles(id, name, user_type, avatar))
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) { setError('Post not found'); return; }

        // Basic visibility gate: allow if public, else only owner
        const isOwner = user?.id && data.user_id === user.id;
        const isPublic = data.visibility === 'public';
        if (!isPublic && !isOwner) {
          setError('This post is not available.');
          setPost(null);
          return;
        }

        // Ensure media_urls is an array of strings
        const mediaUrls: string[] = Array.isArray(data.media_urls)
          ? data.media_urls
          : (typeof data.media_urls === 'string'
              ? (() => { try { return JSON.parse(data.media_urls) as string[]; } catch { return []; } })()
              : []);

        const mapped: PostCardType = {
          ...data,
          id: String(data.id),
          media_urls: mediaUrls,
          profiles: Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles,
        } as unknown as PostCardType;

        if (isMounted) setPost(mapped);
      } catch (e: unknown) {
        console.error('Failed to load post', e);
        if (isMounted) setError('Failed to load post');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPost();
    return () => { isMounted = false; };
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto p-4 lg:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto p-4 lg:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
            <p className="mb-4">{error}</p>
            <Link to="/grandstand" className="text-fedex-orange hover:underline">Back to Grandstand</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto p-4 lg:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
            <p className="mb-4">Post not found.</p>
            <Link to="/grandstand" className="text-fedex-orange hover:underline">Back to Grandstand</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        {(() => {
          // Build meta title/description
          const authorName = (Array.isArray(post.profiles) ? (post.profiles as any)[0]?.name : (post as any).profiles?.name) || post.racer_profiles?.username || 'Racer';
          const title = `${authorName} • Post on OnlyRaceFans`;
          const desc = post.content?.slice(0, 140) || 'View this racing post on OnlyRaceFans.';
          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`;

          // Helper to resolve public URL for storage paths
          const isHttpUrl = (val?: string | null) => !!val && /^(https?:|data:)/i.test(val);
          const toPublicUrl = (val?: string | null) => {
            if (!val) return '';
            if (isHttpUrl(val)) return val;
            try {
              // Try racer-photos bucket by default (banners/avatars live here)
              const { data } = supabase.storage.from('racer-photos').getPublicUrl(val);
              return data.publicUrl || '';
            } catch { return ''; }
          };

          // Prefer banner images for previews
          const bannerRaw = (post as any)?.profiles?.banner_image
            || post.racer_profiles?.profiles?.banner_image
            || (post as any)?.racer_profiles?.banner_photo_url
            || '';
          const bannerUrl = toPublicUrl(bannerRaw);

          // Fallback to first media (image/video)
          const firstMedia = (post.media_urls && post.media_urls.length > 0) ? post.media_urls[0] : '';
          const mediaUrl = toPublicUrl(firstMedia) || firstMedia;

          // Fallback to avatar
          const avatarRaw = (post as any)?.profiles?.avatar || post.racer_profiles?.profile_photo_url || '';
          const avatarUrl = toPublicUrl(avatarRaw);

          const image = bannerUrl || mediaUrl || avatarUrl || '';

          return (
            <>
              <title>{title}</title>
              <meta property="og:type" content="article" />
              <meta property="og:title" content={title} />
              <meta property="og:description" content={desc} />
              <meta property="og:url" content={url} />
              {image && <meta property="og:image" content={image} />}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={title} />
              <meta name="twitter:description" content={desc} />
              {image && <meta name="twitter:image" content={image} />}
            </>
          );
        })()}
      </Helmet>
      <div className="max-w-3xl mx-auto p-4 lg:p-6">
        {!user && (
          <div className="mb-4 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between text-sm">
            <p className="text-slate-300">Viewing a shared post — sign in to tip, comment, or follow.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="ml-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white font-medium"
            >
              Sign In
            </button>
          </div>
        )}
        <PostCard post={post} />
      </div>
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default PostPage;
