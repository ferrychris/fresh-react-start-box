import React from 'react';
import { Eye } from 'lucide-react';

interface FlatProfileHeaderProps {
  name: string;
  username: string;
  avatarUrl: string;
  bannerImageUrl?: string;
  memberSince: string;
  fanType: string;
  points: number;
  dayStreak: number;
  favorites: number;
  badges: number;
  onEditProfile?: () => void;
  onPreviewProfile?: () => void;
}

// Minimal shape used by FanDashboard when passing fanProfile prop
interface FanProfileLike {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  avatar?: string | null;
  banner_image?: string | null;
  fan_type?: string;
  created_at?: string;
  points?: number;
  streak_days?: number;
  favorites_count?: number;
  badges_count?: number;
}

interface FanDashboardHeaderProps {
  fanProfile: FanProfileLike;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  profileCompletionPercentage?: number;
  onPreviewProfile?: () => void;
}

type ProfileHeaderProps = FlatProfileHeaderProps | FanDashboardHeaderProps;

const ProfileHeader: React.FC<ProfileHeaderProps> = (props) => {
  // Support both prop shapes by normalizing to a common view model
  let name: string = '';
  let username: string = '';
  let avatarUrl: string = '';
  let bannerImageUrl: string | undefined;
  let memberSince: string = '';
  let fanType: string = 'Racing Fan';
  let points: number = 0;
  let dayStreak: number = 0;
  let favorites: number = 0;
  let badges: number = 0;
  let onEditProfile: (() => void) | undefined;
  let onPreviewProfile: (() => void) | undefined;

  if ('fanProfile' in props) {
    const fp = props.fanProfile || {} as FanProfileLike;
    name = fp.name || 'Fan';
    username = fp.username || name || 'user';
    avatarUrl = (fp.avatar_url as string) || (fp.avatar as string) || '/default-avatar.png';
    bannerImageUrl = (fp.banner_image as string | undefined) || undefined;
    memberSince = fp.created_at ? new Date(fp.created_at).toLocaleDateString() : '';
    fanType = fp.fan_type || 'Racing Fan';
    points = Number(fp.points) || 0;
    dayStreak = Number(fp.streak_days) || 0;
    favorites = Number(fp.favorites_count) || 0;
    badges = Number(fp.badges_count) || 0;
    onEditProfile = props.onEditProfile;
    onPreviewProfile = props.onPreviewProfile;
  } else {
    const flat = props as FlatProfileHeaderProps;
    name = flat.name;
    username = flat.username;
    avatarUrl = flat.avatarUrl;
    bannerImageUrl = flat.bannerImageUrl;
    memberSince = flat.memberSince;
    fanType = flat.fanType;
    points = flat.points;
    dayStreak = flat.dayStreak;
    favorites = flat.favorites;
    badges = flat.badges;
    onEditProfile = flat.onEditProfile;
    onPreviewProfile = flat.onPreviewProfile;
  }

  // Defensive coercions to prevent runtime errors on initial/empty data
  const safePoints = Number.isFinite(Number(points)) ? Number(points) : 0;
  const safeDayStreak = Number.isFinite(Number(dayStreak)) ? Number(dayStreak) : 0;
  const safeFavorites = Number.isFinite(Number(favorites)) ? Number(favorites) : 0;
  const safeBadges = Number.isFinite(Number(badges)) ? Number(badges) : 0;
  const safeAvatarUrl = typeof avatarUrl === 'string' && avatarUrl.length > 0 ? avatarUrl : '/default-avatar.png';
  const safeMemberSince = memberSince || '';
  const safeFanType = fanType || 'Racing Fan';
  return (
    <div className="relative w-full">
      {/* Modern banner container with elegant styling */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl mx-2 sm:mx-4 lg:mx-6">
        
        {/* Background image with sophisticated overlay */}
        <div className="absolute inset-0 h-64 sm:h-72 lg:h-80 overflow-hidden">
          {bannerImageUrl ? (
            <img 
              src={bannerImageUrl} 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-gray-800 to-gray-900"></div>
          )}
          {/* Elegant gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
        </div>

        {/* Action buttons */}
        {(onEditProfile || onPreviewProfile) && (
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
            {onPreviewProfile && (
              <button
                onClick={onPreviewProfile}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                aria-label="Preview Profile"
                title="Preview Profile"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview Profile</span>
                </div>
              </button>
            )}
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                aria-label="Edit Profile"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="hidden sm:inline">Edit Profile</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Content container with proper spacing */}
        <div className="relative pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
          
          {/* Profile section with responsive layout */}
          <div className="flex flex-col items-start gap-4 sm:gap-6 mb-6 sm:mb-8 pt-16">
            
            {/* Avatar with premium styling - positioned at bottom of banner */}
            <div className="relative -mt-24 ml-4">
              <div className="p-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-xl">
                <div className="p-1 bg-black rounded-full">
                  <img 
                    src={safeAvatarUrl} 
                    alt={name}
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover"
                  />
                </div>
              </div>
              {/* Verified badge with glow effect */}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-3 border-black flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* User information with elegant typography */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    {safeFanType}
                  </span>
                </div>
              </div>
              
              {/* User details with improved spacing */}
              <div className="flex flex-wrap items-center text-gray-300 text-sm lg:text-base gap-2">
                <span className="font-medium text-gray-200">@{username}</span>
                <span className="text-gray-500">•</span>
                <span>Racing Enthusiast</span>
                <span className="text-gray-500">•</span>
                <span>Member since {safeMemberSince}</span>
              </div>
            </div>
          </div>

          {/* Premium stats display - column on mobile, grid on larger screens */}
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4 p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{safePoints.toLocaleString()}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Points</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{safeDayStreak}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Day Streak</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">❤️</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{safeFavorites}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Favorites</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🏅</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{safeBadges}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Badges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
