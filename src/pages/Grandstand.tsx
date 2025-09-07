import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Calendar, MapPin, Trophy, Users, DollarSign, Crown } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import CreatePost from '../components/fan-dashboard/posts/CreatePost';
import { getPublicPostsPage, tipPost } from '../lib/supabase/posts';
import { getNetworkDiagnostics } from '@/lib/network-diagnostics';
import { PostCard, type Post as PostCardType } from '../components/PostCard';
import { supabase } from '../lib/supabase';
import { getJSONCookie, setJSONCookie } from '@/lib/cookies';
import { SuggestionsPanel } from '../components/SuggestionsPanel';
import LeftSidebar from '../components/grandstand/LeftSidebar';
import RightSidebar from '../components/grandstand/RightSidebar';

// Define proper types for the CreatePost component's return value
interface NewPostData {
  id: string;
  content: string;
  userName?: string;
  userAvatar?: string;
  userType?: string;
  likes?: number;
  comments?: number;
  mediaUrls?: string[];
  created_at?: string;
}

// Types for Supabase rows
type FanConnectionRow = {
  became_fan_at: string | null;
  racer_profiles: {
    id: string;
    username: string | null;
    profile_photo_url: string | null;
    team_name: string | null;
  } | null;
};

type RacerProfileRow = {
  id: string;
  username: string | null;
  profile_photo_url: string | null;
  car_number: string | number | null;
  racing_class: string | null;
  team_name: string | null;
  profile_published?: boolean | null;
  is_featured?: boolean | null;
  updated_at?: string | null;
};

type PostRow = {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  media_urls: string[];
  profiles: {
    id: string;
    username: string | null;
    profile_photo_url: string | null;
  } | {
    id: string;
    username: string | null;
    profile_photo_url: string | null;
  }[];
};

export default function Grandstand() {
  // Simple localStorage cache for first page of posts
  const POSTS_CACHE_KEY = 'gs_public_posts_page1';
  const POSTS_CURSOR_CACHE_KEY = 'gs_public_posts_page1_cursor';
  const POSTS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

  const [posts, setPosts] = useState<PostCardType[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [composeAutoOpen, setComposeAutoOpen] = useState<'media' | 'feeling' | null>(null);
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tipping, setTipping] = useState<Record<string, boolean>>({});
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const mountIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const [bgLoading, setBgLoading] = useState<boolean>(false);

  // Log component mount/unmount
  useEffect(() => {
    const mid = mountIdRef.current;
    console.debug('[Grandstand] Mount:', { mountId: mid });
    return () => {
      console.debug('[Grandstand] Unmount:', { mountId: mid });
    };
  }, [POSTS_CACHE_TTL_MS]);

  // Dynamically load teams (racers) the user is a fan of
  const [fanTeams, setFanTeams] = useState<Array<{ id: string; name: string; avatar: string; since?: string }>>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Suggestions: featured racers and derived teams
  const [featuredRacers, setFeaturedRacers] = useState<Array<{ id: string; name: string; avatar: string; car?: string; cls?: string; team?: string }>>([]);
  const [featuredTeams, setFeaturedTeams] = useState<Array<{ name: string; avatar: string }>>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  // Track racers the user follows for label state in Suggested Racers
  const [followingRacers, setFollowingRacers] = useState<Set<string>>(new Set());
  // Left sidebar: Racers You Follow list
  const [racersFollowed, setRacersFollowed] = useState<Array<{ id: string; name: string; avatar: string; since?: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTeams = async () => {
      if (!user?.id) {
        if (isMounted) setFanTeams([]);
        return;
      }
      // Prefill from cookie for faster first paint
      try {
        const cached = getJSONCookie<Array<{ id: string; name: string; avatar: string; since?: string }>>('gs_fan_teams');
        if (cached && Array.isArray(cached) && cached.length && isMounted) {
          setFanTeams(cached);
        }
      } catch {/* ignore bad cookie */}
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const { data, error } = await supabase
          .from('team_followers')
          .select(`
            followed_at,
            team_id,
            teams!inner(
              team_name,
              logo_url
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('teams.is_active', true)
          .order('followed_at', { ascending: false });
        if (error) throw error;
        const teams = (data || []).map((row: any) => ({
          id: row.team_id,
          name: row.teams?.team_name || 'Team',
          avatar: row.teams?.logo_url || 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
          since: row.followed_at ? `Following since ${new Date(row.followed_at).getFullYear()}` : undefined,
        }));
        console.debug('[Grandstand] Loaded followed teams:', { count: teams.length });
        if (isMounted) {
          setFanTeams(teams);
          setJSONCookie('gs_fan_teams', teams, 60 * 10);
        }
      } catch (e: unknown) {
        console.error('[Grandstand] Failed to load teams', e);
        const msg = e instanceof Error ? e.message : 'Failed to load teams';
        if (isMounted) setTeamsError(msg);
      } finally {
        if (isMounted) setTeamsLoading(false);
      }
    };
    fetchTeams();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Load Suggestions: Featured racers and teams
  useEffect(() => {
    let isMounted = true;
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      try {
        // Prefill from cookies to reduce perceived load
        try {
          const cachedRacers = getJSONCookie<Array<{ id: string; name: string; avatar: string; car?: string; cls?: string; team?: string }>>('gs_featured_racers');
          const cachedTeams = getJSONCookie<Array<{ name: string; avatar: string }>>('gs_featured_teams');
          if (isMounted) {
            if (cachedRacers && cachedRacers.length) setFeaturedRacers(cachedRacers);
            if (cachedTeams && cachedTeams.length) setFeaturedTeams(cachedTeams);
          }
        } catch {/* ignore cookie parse issues */}
        let rpRows: RacerProfileRow[] = [];
        // Fetch racers the user already follows to filter suggestions and set following state
        const followedRacerIds = new Set<string>();
        try {
          if (user?.id) {
            const { data: follows } = await supabase
              .from('fan_connections')
              .select(`
                racer_id,
                became_fan_at,
                racer_profiles!fan_connections_racer_id_fkey (username, profile_photo_url)
              `)
              .eq('fan_id', user.id);
            if (Array.isArray(follows)) {
              const racers: Array<{ id: string; name: string; avatar: string; since?: string }> = [];
              for (const f of follows as any[]) {
                if (f.racer_id) {
                  followedRacerIds.add(String(f.racer_id));
                  racers.push({
                    id: String(f.racer_id),
                    name: f.racer_profiles?.username || 'Racer',
                    avatar: f.racer_profiles?.profile_photo_url || 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
                    since: f.became_fan_at ? `Following since ${new Date(f.became_fan_at).getFullYear()}` : undefined,
                  });
                }
              }
              // Also include racers who are fans of the current user (reciprocal), identified by fan user_type = 'racer'
              const { data: racerFans } = await supabase
                .from('fan_connections')
                .select(`
                  fan_id,
                  became_fan_at,
                  profiles!fan_connections_fan_id_fkey (name, user_type, avatar)
                `)
                .eq('racer_id', user.id);

              const byId = new Map<string, { id: string; name: string; avatar: string; since?: string }>();
              // seed with followed racers
              for (const r of racers) byId.set(r.id, r);

              if (Array.isArray(racerFans)) {
                for (const rf of racerFans as any[]) {
                  if (rf?.profiles?.user_type === 'racer' && rf.fan_id) {
                    const id = String(rf.fan_id);
                    if (!byId.has(id)) {
                      byId.set(id, {
                        id,
                        name: rf.profiles?.name || 'Racer',
                        avatar: rf.profiles?.avatar || 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
                        since: rf.became_fan_at ? `Fan since ${new Date(rf.became_fan_at).getFullYear()}` : undefined,
                      });
                    }
                  }
                }
              }

              setFollowingRacers(new Set(Array.from(followedRacerIds)));
              setRacersFollowed(Array.from(byId.values()));
            }
          }
        } catch (e) {
          // non-fatal
        }
        // Safe single query without joining profiles to avoid 400 errors
        const { data: fallback, error: fbErr } = await supabase
          .from('racer_profiles')
          .select('id, username, profile_photo_url, car_number, racing_class, team_name, profile_published, is_featured')
          .or('profile_published.eq.true,is_featured.eq.true')
          .order('updated_at', { ascending: false })
          .limit(8);
        if (fbErr) throw fbErr;
        rpRows = (Array.isArray(fallback) ? fallback : []) as RacerProfileRow[];

        const racers = rpRows
          .filter((r) => r.profile_published !== false)
          .filter((r) => !followedRacerIds.has(String(r.id)))
          .map((r) => ({
            id: String(r.id),
            name: r.username || 'Racer',
            avatar: r.profile_photo_url || 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
            car: r.car_number ? String(r.car_number) : undefined,
            cls: r.racing_class || undefined,
            team: r.team_name || undefined,
          }));

        // Derive teams from featured racers
        const teamMap = new Map<string, { name: string; avatar: string }>();
        for (const r of racers) {
          if (r.team && !teamMap.has(r.team)) {
            teamMap.set(r.team, { name: r.team, avatar: r.avatar });
          }
        }

        if (isMounted) {
          setFeaturedRacers(racers);
          // limit to first 5 teams for suggestions
          const teamsArr = Array.from(teamMap.values()).slice(0, 5);
          setFeaturedTeams(teamsArr);
          // Cache for 10 minutes
          setJSONCookie('gs_featured_racers', racers, 60 * 10);
          setJSONCookie('gs_featured_teams', teamsArr, 60 * 10);
          console.debug('[Grandstand] Suggestions loaded:', { racers: racers.length, teams: teamMap.size });
        }
      } catch (e: unknown) {
        console.error('[Grandstand] Failed to load suggestions', e);
        const msg = e instanceof Error ? e.message : 'Failed to load suggestions';
        if (isMounted) setSuggestionsError(msg);
      } finally {
        if (isMounted) setSuggestionsLoading(false);
      }
    };
    loadSuggestions();
    return () => { isMounted = false; };
  }, []);

  // Realtime: keep 'Teams You Follow' in sync with team_followers changes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('grandstand-team-follows')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_followers' },
        async (payload) => {
          const row = payload.new as { user_id?: string; team_id?: string; is_active?: boolean; followed_at?: string };
          if (row?.user_id !== user.id) return;
          if (row?.is_active !== true) return;
          if (!row?.team_id) return;
          try {
            const { data: team } = await supabase
              .from('teams')
              .select('id, team_name, logo_url, is_active')
              .eq('id', row.team_id)
              .maybeSingle();
            if (team && (team as any).is_active !== false) {
              setFanTeams((prev) => [{
                id: (team as any).id,
                name: (team as any).team_name || 'Team',
                avatar: (team as any).logo_url || 'https://images.pexels.com/photos/26994867/pexels-photo-26994867.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
                since: row.followed_at ? `Following since ${new Date(row.followed_at).getFullYear()}` : undefined,
              }, ...prev.filter(t => t.id !== (team as any).id)]);
            }
          } catch (e) {
            // non-fatal
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'team_followers' },
        (payload) => {
          const row = payload.new as { user_id?: string; team_id?: string; is_active?: boolean };
          if (row?.user_id !== user.id) return;
          if (row?.is_active === false && row?.team_id) {
            setFanTeams((prev) => prev.filter(t => t.id !== row.team_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const prefillFromCache = () => {
      try {
        const raw = localStorage.getItem(POSTS_CACHE_KEY);
        const rawCursor = localStorage.getItem(POSTS_CURSOR_CACHE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { data: PostCardType[]; ts: number };
        if (!parsed || !Array.isArray(parsed.data)) return false;
        const fresh = Date.now() - (parsed.ts || 0) < POSTS_CACHE_TTL_MS;
        if (fresh) {
          const cursor = rawCursor ? (JSON.parse(rawCursor) as { created_at: string; id: string } | null) : null;
          setPosts(parsed.data);
          setNextCursor(cursor || null);
          setLoading(false);
          return true;
        }
      } catch {/* ignore parse errors */}
      return false;
    };

    const load = async () => {
      try {
        console.time('grandstand:firstLoad');
        // Prefill from cache for instant paint if available
        const hadCache = prefillFromCache();
        if (!hadCache) setLoading(true);
        setError(null);
        // First load: keep the response lean to reduce risk of connection drops from large payloads
        const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ limit: 5, includeProfiles: false });
        if (error) throw error;
        if (!isMounted) return;

        // Map posts minimally first (no profiles) for fastest paint and smaller payload
        const minimal: PostCardType[] = (rows || []).map((r) => ({ ...r } as PostCardType));
        console.debug('[Grandstand] Initial posts loaded (minimal):', { count: minimal.length, nextCursor: !!cursor });

        setPosts(minimal);
        setNextCursor(cursor || null);
        // Update cache
        try {
          localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify({ data: minimal, ts: Date.now() }));
          localStorage.setItem(POSTS_CURSOR_CACHE_KEY, JSON.stringify(cursor || null));
        } catch {/* quota or serialization issues */}
        console.timeEnd('grandstand:firstLoad');
        // Kick off profile backfill asynchronously (does not block first paint)
        (async () => {
          const profilesMap: Record<string, { id: string; name: string; email?: string; avatar?: string; user_type?: string; is_verified?: boolean }> = {};
          const racerProfilesMap: Record<string, { id: string; username: string; profile_photo_url?: string; car_number?: string; racing_class?: string; team_name?: string }> = {};
          try {
            // Collect user_ids and racer_ids to backfill their profiles
            const userIds = Array.from(new Set((rows || []).map((r: {user_id?: string}) => r.user_id).filter((v): v is string => typeof v === 'string' && v.length > 0)));
            const racerIds = Array.from(new Set((rows || []).map((r: {racer_id?: string}) => r.racer_id).filter((v): v is string => typeof v === 'string' && v.length > 0)));

            // Fetch regular profiles in one query
            if (userIds.length) {
              const { data: profs, error: profErr } = await supabase
                .from('profiles')
                .select('id, name, email, avatar, user_type')
                .in('id', userIds);
              if (!profErr && Array.isArray(profs)) {
                for (const p of profs) {
                  profilesMap[p.id] = { id: p.id, name: p.name, email: p.email, avatar: p.avatar, user_type: p.user_type };
                }
              }
            }

            // Fetch racer profiles in one query
            if (racerIds.length) {
              const { data: racerProfs, error: racerProfErr } = await supabase
                .from('racer_profiles')
                .select('id, username, profile_photo_url, car_number, racing_class, team_name')
                .in('id', racerIds);
              if (!racerProfErr && Array.isArray(racerProfs)) {
                for (const rp of racerProfs) {
                  racerProfilesMap[rp.id] = {
                    id: rp.id,
                    username: rp.username || 'Racer',
                    profile_photo_url: rp.profile_photo_url,
                    car_number: rp.car_number,
                    racing_class: rp.racing_class,
                    team_name: rp.team_name
                  };
                }
              }
            }

            // Merge profiles into existing posts
            setPosts((prev) => prev.map((p) => {
              const postWithId = p as {user_id?: string; racer_id?: string} & { profiles?: any };
              const userProfile = postWithId.user_id ? profilesMap[postWithId.user_id] : undefined;
              const racerProfile = postWithId.racer_id ? racerProfilesMap[postWithId.racer_id] : undefined;

              const updatedPost: any = { ...p };
              if (userProfile) {
                // Flattened profile object for UI convenience
                updatedPost.profiles = {
                  id: userProfile.id,
                  name: userProfile.name,
                  email: userProfile.email,
                  avatar: userProfile.avatar,
                  user_type: userProfile.user_type,
                  is_verified: userProfile.is_verified,
                };
              }
              if (racerProfile) {
                updatedPost.racer_profiles = {
                  id: racerProfile.id,
                  username: racerProfile.username,
                  profile_photo_url: racerProfile.profile_photo_url,
                  car_number: racerProfile.car_number,
                  racing_class: racerProfile.racing_class,
                  team_name: racerProfile.team_name
                };
              }

              return updatedPost as PostCardType;
            }));
          } catch (e) {
            console.warn('[Grandstand] Profile backfill failed (continuing without profiles)', e);
          }
        })();
      } catch (e) {
        console.error('[Grandstand] Initial load failed', e);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [POSTS_CACHE_TTL_MS]);

  // Realtime: remove posts from UI when they are deleted elsewhere
  useEffect(() => {
    const channel = supabase
      .channel('grandstand-racer-posts-realtime')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'racer_posts' },
        (payload) => {
          const oldRow = payload.old as { id?: string | number } | null;
          const deletedRaw = oldRow?.id;
          const deletedId = deletedRaw != null ? String(deletedRaw) : undefined;
          if (!deletedId) return;
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.debug('[Grandstand] Realtime subscription status:', status);
        return null;
      });

    return () => {
      console.debug('[Grandstand] Realtime subscription cleanup');
      supabase.removeChannel(channel);
    };
  }, []);

  // Load more posts with optimized batching (default 12 at a time)
  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const loadMore = useCallback(async (limit: number = 5, opts?: { silent?: boolean }) => {
    if (!nextCursor) return;
    // Reduce debounce time for faster response (300ms instead of 600ms)
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 300) return;
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    console.time('grandstand:loadMore');
    if (!opts?.silent) setLoadingMore(true);
    try {
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ limit, cursor: nextCursor });
      if (error) throw error;
      const mapped: PostCardType[] = (rows || []).map((r: PostCardType) => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return { ...r, profiles: profile } as PostCardType;
      });
      console.debug('[Grandstand] loadMore fetched:', { count: mapped.length, hasNext: !!cursor });
      setPosts(prev => [...prev, ...mapped]);
      setNextCursor(cursor || null);
      console.timeEnd('grandstand:loadMore');
    } catch (e) {
      console.error('[Grandstand] Failed to load more posts', e);
    } finally {
      if (!opts?.silent) setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [nextCursor]);

  // Aggressive background prefetching: fetch larger batches more frequently
  useEffect(() => {
    if (!nextCursor) return; // nothing to prefetch
    let intervalId: number | null = null;

    // Adjust interval based on network conditions - more aggressive timing
    const { effectiveType } = getNetworkDiagnostics();
    // Less aggressive: avoid server timeouts and overlapping loads
    const intervalMs = effectiveType === '4g' ? 2500 : effectiveType === '3g' ? 4000 : 6000;

    const tick = async () => {
      if (document.hidden) return; // pause when tab not visible
      if (!nextCursor) return; // nothing to fetch
      // Avoid background prefetch if user is already explicitly loading more or a fetch is in progress
      if (loadingMore) return;
      if (isFetchingRef.current) return;
      setBgLoading(true);
      try {
        // Load small batches in background to keep latency low
        await loadMore(5, { silent: true });
      } finally {
        setBgLoading(false);
      }
    };
    intervalId = window.setInterval(tick, intervalMs);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [nextCursor, loadMore, loadingMore]);

  // Aggressive infinite scroll with much earlier trigger
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!nextCursor) return; // nothing more to load

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          console.debug('[Grandstand] Sentinel intersecting -> loadMore');
          // Load small batch when user scrolls near bottom
          loadMore(5);
        }
      }
    }, { 
      root: null, 
      rootMargin: '800px', // Trigger much earlier - 800px before reaching sentinel
      threshold: 0 
    });

    observer.observe(el);
    return () => {
      try { observer.unobserve(el); } catch (err) { /* ignore unobserve errors */ }
      console.debug('[Grandstand] IntersectionObserver disconnected');
      observer.disconnect();
    };
  }, [nextCursor, loadMore]);

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
    } catch (e: unknown) {
      console.error('Exception in tip:', e);
      const message = e instanceof Error ? e.message : 'Failed to tip';
      alert(message);
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Modern Header Section */}
      {!user && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-green-600/10"></div>
          <div className="relative max-w-4xl mx-auto px-4 py-12">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl mb-6 animate-scale-in">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Grandstand
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Where the racing community comes together to share moments, stories, and passion for the sport
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Feed */}
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_260px] gap-6">
          <LeftSidebar 
            user={user} 
            teamsLoading={teamsLoading} 
            teamsError={teamsError} 
            fanTeams={fanTeams}
            racersFollowed={racersFollowed}
            onUnfollowTeam={async (teamId: string) => {
              try {
                if (!user?.id) return;
                // Mark team follow as inactive
                const { error } = await supabase
                  .from('team_followers')
                  .update({ is_active: false })
                  .eq('user_id', user.id)
                  .eq('team_id', teamId)
                  .eq('is_active', true);
                if (error) throw error;
                // Update UI
                setFanTeams((prev) => prev.filter(t => t.id !== teamId));
              } catch (e) {
                console.error('Failed to unfollow team:', e);
              }
            }}
            onUnfollowRacer={async (racerId: string) => {
              try {
                if (!user?.id) return;
                const { error } = await supabase
                  .from('fan_connections')
                  .delete()
                  .eq('fan_id', user.id)
                  .eq('racer_id', racerId);
                if (error) throw error;
                // Update local lists
                setRacersFollowed((prev) => prev.filter(r => r.id !== racerId));
                setFollowingRacers((prev) => {
                  const next = new Set(Array.from(prev));
                  next.delete(racerId);
                  return next;
                });
              } catch (e) {
                console.error('Failed to unfollow racer (sidebar):', e);
              }
            }}
          />
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
              <div className="space-y-4" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="flex-1">
                        <div className="w-40 h-3 bg-slate-800 rounded" />
                        <div className="w-24 h-2 bg-slate-800 rounded mt-2" />
                      </div>
                      <div className="w-6 h-6 bg-slate-800 rounded" />
                    </div>
                    {/* Body text */}
                    <div className="space-y-2 mb-3">
                      <div className="w-full h-3 bg-slate-800 rounded" />
                      <div className="w-11/12 h-3 bg-slate-800 rounded" />
                      <div className="w-5/12 h-3 bg-slate-800 rounded" />
                    </div>
                    {/* Media placeholder */}
                    <div className="w-full h-64 bg-slate-800/80 rounded-xl mb-4" />
                    {/* Footer actions */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-6 bg-slate-800 rounded" />
                      <div className="w-16 h-6 bg-slate-800 rounded" />
                      <div className="w-16 h-6 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
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
            {/* Tiny skeletons during background timed loads */}
            {bgLoading && (
              <div className="space-y-4" aria-hidden="true">
                {[0,1,2].map((i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="flex-1">
                        <div className="w-32 h-3 bg-slate-800 rounded" />
                        <div className="w-20 h-2 bg-slate-800 rounded mt-2" />
                      </div>
                    </div>
                    <div className="w-full h-24 bg-slate-800 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
            {/* Load more controls */}
            <div ref={sentinelRef} />
            {nextCursor && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => loadMore(5)}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
            {loadingMore && (
              <div className="space-y-4 mt-2" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="flex-1">
                        <div className="w-32 h-3 bg-slate-800 rounded" />
                        <div className="w-20 h-2 bg-slate-800 rounded mt-2" />
                      </div>
                    </div>
                    <div className="w-full h-24 bg-slate-800 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <RightSidebar 
            suggestionsLoading={suggestionsLoading} 
            suggestionsError={suggestionsError} 
            featuredRacers={featuredRacers} 
            featuredTeams={featuredTeams} 
            onFollowRacer={async (racerId: string) => {
              try {
                if (!user?.id) return;
                // upsert fan connection
                const { error } = await supabase
                  .from('fan_connections')
                  .upsert({
                    fan_id: user.id,
                    racer_id: racerId,
                    is_subscribed: false,
                    became_fan_at: new Date().toISOString()
                  }, { onConflict: 'fan_id,racer_id' });
                if (error) throw error;
                // mark following locally
                setFollowingRacers((prev) => new Set([...Array.from(prev), racerId]));
              } catch (e) {
                console.error('Failed to follow racer:', e);
              }
            }}
            onUnfollowRacer={async (racerId: string) => {
              try {
                if (!user?.id) return;
                const { error } = await supabase
                  .from('fan_connections')
                  .delete()
                  .eq('fan_id', user.id)
                  .eq('racer_id', racerId);
                if (error) throw error;
                setFollowingRacers((prev) => {
                  const next = new Set(Array.from(prev));
                  next.delete(racerId);
                  return next;
                });
              } catch (e) {
                console.error('Failed to unfollow racer:', e);
              }
            }}
            followingRacers={followingRacers}
          />
        </div>
      </div>
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={(newPost: NewPostData) => {
            // Create a properly typed object
            const adaptedPost: PostCardType = {
              ...newPost,
              profiles: {
                id: user?.id || '',
                name: newPost.userName || 'User',
                avatar: newPost.userAvatar || '',
                user_type: newPost.userType || 'fan'
              },
              user_id: user?.id || '',
              likes_count: newPost.likes ?? 0,
              comments_count: newPost.comments ?? 0,
              media_urls: newPost.mediaUrls || [],
              created_at: newPost.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              post_type: 'text' as const,
              visibility: 'public' as const,
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