import React from 'react';

interface ProfileHeaderProps {
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
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  username,
  avatarUrl,
  bannerImageUrl,
  memberSince,
  fanType,
  points,
  dayStreak,
  favorites,
  badges,
  onEditProfile
}) => {

  return (
    <div className="relative w-full rounded-xl border border-gray-800 overflow-hidden ml-[60px] mr-[100px]">
      {/* Background image with overlay */}
      <div className="absolute inset-0 h-[200px] w-full overflow-hidden">
        {bannerImageUrl ? (
          <img 
            src={bannerImageUrl} 
            alt="Profile Banner" 
            className="w-[calc(100%-120px)] h-[200px] object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
        )}
        {/* Subtle dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/25"></div>
        {/* Bottom gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black"></div>
      </div>

      {/* Edit Profile button overlayed on banner */}
      {onEditProfile && (
        <button
          onClick={onEditProfile}
          className="absolute bottom-4 right-[180px] z-10 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md"
          aria-label="Edit Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      <div className="relative pt-12 pb-4 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Avatar with verified badge */}
          <div className="relative mt-4">
            <div className="rounded-full ring-2 ring-green-500 p-0.5">
              <img 
                src={avatarUrl} 
                alt={name}
                className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-white shadow-lg"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center shadow">
              <span className="text-white text-[10px] md:text-xs">✓</span>
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 mt-4 md:mt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold text-white">{name}</h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full shadow-md">
                  {fanType}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center text-gray-300 text-sm mt-2">
              <span className="font-medium">@{username}</span>
              <span className="mx-2 text-gray-500">•</span>
              <span>Racing Fan</span>
              <span className="mx-2 text-gray-500">•</span>
              <span>Member since {memberSince}</span>
            </div>
          </div>

          {/* Edit profile button - only shown if handler is provided */}
          {/* Edit button moved to banner overlay */}
        </div>

        {/* Stats row */}
        <div className="inline-flex flex-wrap items-center gap-4 mt-6 text-sm bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm max-w-[720px] md:max-w-[840px] lg:max-w-[900px] w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🏆</span>
            <span className="text-amber-500 font-bold text-lg">{points}</span>
            <span className="text-gray-300">points</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔥</span>
            <span className="text-amber-500 font-bold text-lg">{dayStreak}</span>
            <span className="text-gray-300">day streak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400">❤️</span>
            <span className="text-amber-500 font-bold text-lg">{favorites}</span>
            <span className="text-gray-300">favorites</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🪪</span>
            <span className="text-amber-500 font-bold text-lg">{badges}</span>
            <span className="text-gray-300">badges</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
