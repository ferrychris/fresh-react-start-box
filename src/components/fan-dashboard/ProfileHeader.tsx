import React from 'react';
import { Eye } from 'lucide-react';

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
  onPreviewProfile?: () => void;
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
  onEditProfile,
  onPreviewProfile
}) => {

  return (
    <div className="relative w-full">
      {/* Modern banner container with elegant styling */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl mx-4 sm:mx-6 lg:mx-8">
        
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
        <div className="relative pt-16 sm:pt-20 lg:pt-24 pb-8 px-6 sm:px-8 lg:px-10">
          
          {/* Profile section with responsive layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
            
            {/* Avatar with premium styling */}
            <div className="relative">
              <div className="p-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-xl">
                <div className="p-1 bg-black rounded-full">
                  <img 
                    src={avatarUrl} 
                    alt={name}
                    className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover"
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
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    {fanType}
                  </span>
                </div>
              </div>
              
              {/* User details with improved spacing */}
              <div className="flex flex-wrap items-center text-gray-300 text-sm lg:text-base gap-2">
                <span className="font-medium text-gray-200">@{username}</span>
                <span className="text-gray-500">•</span>
                <span>Racing Enthusiast</span>
                <span className="text-gray-500">•</span>
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Premium stats display - column on mobile, grid on larger screens */}
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4 p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{points.toLocaleString()}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Points</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{dayStreak}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Day Streak</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">❤️</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{favorites}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Favorites</div>
            </div>
            
            <div className="text-center w-full sm:w-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">🏅</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{badges}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Badges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
