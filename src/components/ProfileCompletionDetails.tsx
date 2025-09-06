import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ProfileCompletionDetailsProps {
  userId: string;
  userType: 'fan' | 'racer';
  onFieldClick?: (field: string) => void;
}

interface CompletionField {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  weight: number;
}

export const ProfileCompletionDetails: React.FC<ProfileCompletionDetailsProps> = ({
  userId,
  userType,
  onFieldClick
}) => {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<CompletionField[]>([]);
  const [completionPct, setCompletionPct] = useState(0);
  const [fanCount, setFanCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        setIsVerified(!!profileData?.is_verified);
        
        if (userType === 'fan') {
          // Fetch fan profile data
          const { data: fanProfile, error } = await supabase
            .from('fan_profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching fan profile:', error);
            return;
          }
          
          // Define fan fields
          const fanFields: CompletionField[] = [
            { 
              key: 'location', 
              label: 'Location', 
              description: 'Where are you from? This helps connect you with local racing events.',
              completed: Boolean(fanProfile?.location), 
              weight: 15 
            },
            { 
              key: 'favorite_classes', 
              label: 'Favorite Racing Classes', 
              description: 'Select the racing classes you enjoy following the most.',
              completed: Boolean(fanProfile?.favorite_classes?.length), 
              weight: 15 
            },
            { 
              key: 'favorite_tracks', 
              label: 'Favorite Tracks', 
              description: 'Pick the tracks you love to watch races at.',
              completed: Boolean(fanProfile?.favorite_tracks?.length), 
              weight: 15 
            },
            { 
              key: 'followed_racers', 
              label: 'Followed Racers', 
              description: 'Follow racers to see their updates in your feed.',
              completed: Boolean(fanProfile?.followed_racers?.length), 
              weight: 15 
            },
            { 
              key: 'why_i_love_racing', 
              label: 'Why You Love Racing', 
              description: 'Share your racing passion with the community.',
              completed: Boolean(fanProfile?.why_i_love_racing), 
              weight: 20 
            },
            { 
              key: 'profile_photo_url', 
              label: 'Profile Photo', 
              description: 'Add a profile photo to help others recognize you.',
              completed: Boolean(fanProfile?.profile_photo_url), 
              weight: 20 
            },
          ];
          
          setFields(fanFields);
          
          // Calculate completion percentage
          const total = fanFields.reduce((sum, field) => sum + field.weight, 0);
          const completed = fanFields.reduce((sum, field) => sum + (field.completed ? field.weight : 0), 0);
          setCompletionPct(Math.round((completed / total) * 100));
          
        } else if (userType === 'racer') {
          // Fetch racer profile data
          const { data: racerProfile, error } = await supabase
            .from('racer_profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching racer profile:', error);
            return;
          }
          
          // Count fans
          const { count: fanCount, error: fanError } = await supabase
            .from('fan_connections')
            .select('id', { count: 'exact', head: true })
            .eq('racer_id', userId);
            
          if (!fanError) {
            setFanCount(fanCount || 0);
          }
          
          // Define racer fields
          const racerFields: CompletionField[] = [
            { 
              key: 'profile_photo_url', 
              label: 'Profile Photo', 
              description: 'Add a professional profile photo to represent yourself.',
              completed: Boolean(racerProfile?.profile_photo_url), 
              weight: 20 
            },
            { 
              key: 'banner_photo_url', 
              label: 'Banner Photo', 
              description: 'Add a banner photo to showcase your racing identity.',
              completed: Boolean(racerProfile?.banner_photo_url), 
              weight: 15 
            },
            { 
              key: 'car_number', 
              label: 'Car Number', 
              description: 'Your racing car number helps fans identify you.',
              completed: Boolean(racerProfile?.car_number), 
              weight: 20 
            },
            { 
              key: 'racing_class', 
              label: 'Racing Class', 
              description: 'The class or category you compete in.',
              completed: Boolean(racerProfile?.racing_class), 
              weight: 20 
            },
            { 
              key: 'team_name', 
              label: 'Team Name', 
              description: 'Your racing team or independent status.',
              completed: Boolean(racerProfile?.team_name), 
              weight: 15 
            },
            { 
              key: 'bio', 
              label: 'Biography', 
              description: 'Tell fans about your racing journey and achievements.',
              completed: Boolean(racerProfile?.bio), 
              weight: 10 
            },
          ];
          
          setFields(racerFields);
          
          // Calculate completion percentage
          const total = racerFields.reduce((sum, field) => sum + field.weight, 0);
          const completed = racerFields.reduce((sum, field) => sum + (field.completed ? field.weight : 0), 0);
          setCompletionPct(Math.round((completed / total) * 100));
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, userType]);
  
  // Get color based on completion percentage
  const getColorClass = (pct: number) => {
    if (pct < 30) return 'bg-red-500';
    if (pct < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="h-2 bg-gray-700 rounded w-4/6 mb-2"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-white">{completionPct}%</div>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-6">
        <div 
          className={`h-full transition-all duration-500 ${getColorClass(completionPct)}`}
          style={{ width: `${completionPct}%` }}
        />
      </div>
      
      {/* Verification status for racers */}
      {userType === 'racer' && (
        <div className={`mb-6 p-4 rounded-lg border ${isVerified ? 'bg-blue-900/20 border-blue-800/50' : 'bg-gray-700/30 border-gray-600/50'}`}>
          <div className="flex items-start gap-3">
            {isVerified ? (
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            )}
            <div>
              <h4 className="font-medium text-white">
                {isVerified ? 'Your profile is verified!' : 'Verification Status'}
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                {isVerified 
                  ? 'Your profile is complete and you have 10+ fans. Your posts will show a verified badge.'
                  : `To get verified: ${completionPct < 100 ? 'Complete your profile and ' : ''}get at least 10 fans (currently ${fanCount}).`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Fields list */}
      <div className="space-y-3">
        {fields.map((field) => (
          <div 
            key={field.key}
            className={`p-3 rounded-lg border ${field.completed 
              ? 'bg-green-900/10 border-green-800/30' 
              : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 cursor-pointer'
            }`}
            onClick={() => !field.completed && onFieldClick?.(field.key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {field.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={`font-medium ${field.completed ? 'text-green-300' : 'text-gray-300'}`}>
                  {field.label}
                </span>
              </div>
              <span className="text-xs text-gray-400">+{field.weight}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              {field.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
