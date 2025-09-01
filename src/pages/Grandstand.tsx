import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Calendar, MapPin, Trophy, Users, DollarSign, Crown } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import CreatePost from '../components/fan-dashboard/posts/CreatePost';
import { getFanPosts, tipPost } from '../lib/supabase/posts';
import { PostCard, type Post as PostCardType } from '../components/PostCard';

interface Post extends PostCardType {
  // Keep this for now, but we aim to use PostCardType directly
}

export default function Grandstand() {
  const [posts, setPosts] = useState<PostCardType[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [composeAutoOpen, setComposeAutoOpen] = useState<'media' | 'feeling' | null>(null);
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tipping, setTipping] = useState<Record<string, boolean>>({});

  // TODO: Replace with Supabase-backed list of teams the user follows/is a fan of
  const fanTeams: Array<{ id: string; name: string; avatar: string; since?: string }> = user ? [
    { id: 't1', name: 'Team Velocity', avatar: 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', since: 'Fan since 2024' },
    { id: 't2', name: 'Apex Racing', avatar: 'https://images.pexels.com/photos/26994866/pexels-photo-26994866.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', since: 'Fan since 2023' },
    { id: 't3', name: 'Thunder Motorsports', avatar: 'https://images.pexels.com/photos/26994865/pexels-photo-26994865.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', since: 'Fan since 2022' },
  ] : [];

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await getFanPosts();
        if (!isMounted) return;

        const mapped: PostCardType[] = (rows || []).map((r: any): PostCardType => {
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            ...r,
            racer_profiles: {
              profiles: profile
            }
          };
        });

        setPosts(mapped);
      } catch (e: any) {
        console.error('Failed to load posts', e);
        if (!isMounted) return;
        setError(e?.message || 'Failed to load posts');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handlePostUpdate = () => {
    // Optional: re-fetch posts or update a single post
    // For now, a simple log is fine
    console.log('A post was updated, consider re-fetching.');
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
  };

  const handleTip = async (postId: string) => {
    if (!postId || tipping[postId]) return;
    setTipping(prev => ({ ...prev, [postId]: true }));
    try {
      const { error } = await tipPost(postId, 500);
      if (error) {
        console.error('Tip failed:', error);
        alert(error.message || 'Failed to tip');
      }
    } catch (e: any) {
      console.error('Exception in tip:', e);
      alert(e?.message || 'Failed to tip');
    } finally {
      setTipping(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleBecomeFan = async (racerUserId: string) => {
    // TODO: Implement fan connection or subscription flow
    console.log('Become a Fan clicked for', racerUserId);
    alert('Become a Fan coming soon!');
  };

  const handleJoinTeam = async (racerUserId: string) => {
    // TODO: Implement join team / subscription flow
    console.log('Join Team clicked for', racerUserId);
    alert('Join Team coming soon!');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Guest Header */}
      {!user && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white racing-number">Grandstand</h1>
              <p className="text-slate-400 text-sm lg:text-base">Latest from the racing community</p>
            </div>
          </div>
        </div>
      )}
      {/* Feed */}
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_260px] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Community Guidelines</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start">
                  <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <span>Be respectful. No harassment, hate speech, or bullying.</span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <span>Keep it racing. Off-topic or NSFW content may be removed.</span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <span>No spam, scams, or misleading promotions.</span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <span>Protect privacy. Don’t share personal info without consent.</span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <span>Report issues. Use the menu to flag problematic posts.</span>
                </li>
              </ul>
              <div className="mt-3 text-xs text-slate-400">By participating, you agree to these rules.</div>
            </div>
          </aside>
          <div className="space-y-6">
            {user && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <div className="flex items-center">
                    <img
                      src={user.avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <button
                      onClick={() => { setComposeAutoOpen(null); setShowCreatePost(true); }}
                      className="ml-3 flex-1 text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 placeholder-slate-500 rounded-full px-4 py-2 transition-colors"
                    >
                      {user.user_type === 'racer' ? "What's on your mind, driver?" :
                       user.user_type === 'track' ? "Share an update with fans..." :
                       user.user_type === 'series' ? "Announce championship news..." :
                       "What's on your mind?"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <button
                      onClick={() => { setComposeAutoOpen('media'); setShowCreatePost(true); }}
                      className="flex items-center justify-center space-x-2 py-2 rounded-xl hover:bg-slate-800 text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                        <path d="M4.5 5.25A2.25 2.25 0 016.75 3h10.5A2.25 2.25 0 0119.5 5.25v13.5A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V5.25zM7.5 8.25a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM18 17.25l-4.5-6-3.375 4.5L7.5 12.75l-3 4.5h13.5z" />
                      </svg>
                      <span className="text-sm font-medium">Photo/Video</span>
                    </button>
                    <button
                      onClick={() => { setComposeAutoOpen('feeling'); setShowCreatePost(true); }}
                      className="flex items-center justify-center space-x-2 py-2 rounded-xl hover:bg-slate-800 text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
                        <path d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM8.25 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 18a5.25 5.25 0 01-4.719-2.906.75.75 0 011.338-.688A3.75 3.75 0 0012 16.5a3.75 3.75 0 003.381-2.094.75.75 0 011.338.688A5.25 5.25 0 0112 18z" />
                      </svg>
                      <span className="text-sm font-medium">Feeling/Activity</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {loading && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-400">Loading posts...</div>
            )}
            {error && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-red-400">{error}</div>
            )}
            {!loading && !error && posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onPostUpdate={handlePostUpdate} 
                onPostDeleted={() => handlePostDeleted(post.id)}
              />
            ))}
          </div>

          {/* Right sidebar: Teams user is a fan of */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">Your Teams</h2>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                {user ? (
                  fanTeams.length > 0 ? (
                    <ul className="space-y-3">
                      {fanTeams.map(team => (
                        <li key={team.id} className="flex items-center">
                          <img src={team.avatar} alt={team.name} className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-700" />
                          <div className="ml-3">
                            <div className="text-sm text-white font-medium">{team.name}</div>
                            {team.since && <div className="text-[11px] text-slate-400">{team.since}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-400">Follow teams to see them here.</div>
                  )
                ) : (
                  <div className="text-sm text-slate-400">Sign in to see the teams you support.</div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Suggestions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 transition">Explore Teams</button>
                  <button className="w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 transition">Find Racers</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={(newPost) => {
            // This logic might need adjustment based on the actual return type of onPostCreated
            const adaptedPost: PostCardType = {
              ...newPost,
              racer_profiles: {
                profiles: {
                  name: newPost.userName,
                  avatar: newPost.userAvatar,
                  user_type: newPost.userType
                }
              },
              likes_count: newPost.likes ?? 0,
              comments_count: newPost.comments ?? 0,
              media_urls: newPost.mediaUrls || [],
              created_at: newPost.createdAt || new Date().toISOString(),
              updated_at: new Post().toISOString(),
              post_type: 'text', // Assuming default, adjust as needed
              visibility: 'public',
              total_tips: 0,
              allow_tips: false
            };
            setPosts([adaptedPost, ...posts]);
            setShowCreatePost(false);
            setComposeAutoOpen(null);
          }}
          autoOpen={composeAutoOpen}
        />
      )}
    </div>
  );
}