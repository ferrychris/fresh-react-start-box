import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ProfileField {
  name: string;
  label: string;
  weight: number;
  completed: boolean;
}

interface ProfileCompletionIndicatorProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
}

export const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({ 
  userId,
  className = '',
  showTooltip = true
}) => {
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMissingFields, setShowMissingFields] = useState<boolean>(false);
  const [fields, setFields] = useState<ProfileField[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const calculateCompletion = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch fan profile data
        const { data: fanProfile, error } = await supabase
          .from('fan_profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching fan profile:', error);
          return;
        }
        
        // Define required fields and their weights
        const profileFields: ProfileField[] = [
          { name: 'location', label: 'Your Location', weight: 15, completed: Boolean(fanProfile?.location) },
          { name: 'favorite_classes', label: 'Favorite Racing Classes', weight: 15, completed: Boolean(fanProfile?.favorite_classes?.length) },
          { name: 'favorite_tracks', label: 'Favorite Tracks', weight: 15, completed: Boolean(fanProfile?.favorite_tracks?.length) },
          { name: 'followed_racers', label: 'Followed Racers', weight: 15, completed: Boolean(fanProfile?.followed_racers?.length) },
          { name: 'why_i_love_racing', label: 'Why You Love Racing', weight: 20, completed: Boolean(fanProfile?.why_i_love_racing) },
          { name: 'profile_photo_url', label: 'Profile Photo', weight: 20, completed: Boolean(fanProfile?.profile_photo_url) },
        ];
        
        // Calculate completion percentage
        const totalWeight = profileFields.reduce((sum, field) => sum + field.weight, 0);
        const completedWeight = profileFields.reduce((sum, field) => 
          sum + (field.completed ? field.weight : 0), 0);
        
        const percentage = Math.round((completedWeight / totalWeight) * 100);
        setCompletionPercentage(percentage);
        setFields(profileFields);
      } catch (error) {
        console.error('Error calculating profile completion:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateCompletion();
  }, [userId]);
  
  // Determine color based on completion percentage
  const getColorClass = () => {
    if (completionPercentage < 30) return 'bg-red-500';
    if (completionPercentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowMissingFields(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (loading) return null;
  
  // Get incomplete fields
  const incompleteFields = fields.filter(field => !field.completed);
  
  return (
    <div className={`relative ${className}`}>
      <div 
        className={`flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-gray-800/50 transition-colors`}
        onClick={() => completionPercentage < 100 ? setShowMissingFields(!showMissingFields) : navigate('/settings/profile')}
        title={completionPercentage < 100 ? "View missing profile fields" : "Profile complete!"}
      >
        <div className="w-full max-w-[100px] h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColorClass()} transition-all duration-500`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        {completionPercentage < 100 && (
          <div className="flex items-center text-xs">
            <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
            <span className="text-gray-300">{completionPercentage}%</span>
          </div>
        )}
        
        {completionPercentage === 100 && (
          <div className="flex items-center text-xs text-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Complete!</span>
          </div>
        )}
      </div>
      
      {/* Tooltip showing missing fields */}
      {showTooltip && showMissingFields && incompleteFields.length > 0 && (
        <div 
          ref={tooltipRef}
          className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="p-3 border-b border-gray-700 bg-gray-800">
            <h4 className="text-sm font-medium text-white">Complete Your Profile</h4>
            <p className="text-xs text-gray-400 mt-1">Add these details to reach 100%</p>
          </div>
          
          <div className="p-2">
            {incompleteFields.map((field) => (
              <div key={field.name} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-300">{field.label}</span>
                <span className="text-xs text-gray-500 ml-auto">+{field.weight}%</span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/settings/profile')} 
            className="w-full p-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            Complete Now
          </button>
        </div>
      )}
    </div>
  );
};
