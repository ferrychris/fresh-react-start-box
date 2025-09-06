import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, ChevronRight, CheckCircle, Camera, MapPin, Heart, Trophy, Users, MessageSquare } from 'lucide-react';
import { awardPoints } from '../lib/supabase/rewards';

interface ProfileCompletionGuideProps {
  userId: string;
  onClose: () => void;
}

interface Step {
  id: string;
  title: string;
  description: string;
  field: string;
  icon: React.ReactNode;
  points: number;
}

export const ProfileCompletionGuide: React.FC<ProfileCompletionGuideProps> = ({
  userId,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const steps: Step[] = [
    {
      id: 'profile_photo',
      title: 'Add a Profile Photo',
      description: 'Help other fans and racers recognize you with a profile photo.',
      field: 'profile_photo_url',
      icon: <Camera className="w-5 h-5" />,
      points: 10
    },
    {
      id: 'location',
      title: 'Add Your Location',
      description: "Let others know where you're from and find local racing events.",
      field: 'location',
      icon: <MapPin className="w-5 h-5" />,
      points: 5
    },
    {
      id: 'favorite_classes',
      title: 'Select Favorite Classes',
      description: 'Tell us which racing classes you enjoy following the most.',
      field: 'favorite_classes',
      icon: <Trophy className="w-5 h-5" />,
      points: 5
    },
    {
      id: 'favorite_tracks',
      title: 'Select Favorite Tracks',
      description: 'Pick the tracks you love to watch races at.',
      field: 'favorite_tracks',
      icon: <Heart className="w-5 h-5" />,
      points: 5
    },
    {
      id: 'followed_racers',
      title: 'Follow Some Racers',
      description: 'Follow racers to see their updates in your feed.',
      field: 'followed_racers',
      icon: <Users className="w-5 h-5" />,
      points: 5
    },
    {
      id: 'why_i_love_racing',
      title: 'Tell Your Racing Story',
      description: 'Share why you love racing with the community.',
      field: 'why_i_love_racing',
      icon: <MessageSquare className="w-5 h-5" />,
      points: 10
    }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
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
        
        setProfile(fanProfile);
        
        // Mark completed steps
        const completedSteps: Record<string, boolean> = {};
        steps.forEach(step => {
          if (step.field === 'profile_photo_url') {
            completedSteps[step.id] = Boolean(fanProfile?.profile_photo_url);
          } else if (step.field === 'location') {
            completedSteps[step.id] = Boolean(fanProfile?.location);
          } else if (step.field === 'favorite_classes') {
            completedSteps[step.id] = Boolean(fanProfile?.favorite_classes?.length);
          } else if (step.field === 'favorite_tracks') {
            completedSteps[step.id] = Boolean(fanProfile?.favorite_tracks?.length);
          } else if (step.field === 'followed_racers') {
            completedSteps[step.id] = Boolean(fanProfile?.followed_racers?.length);
          } else if (step.field === 'why_i_love_racing') {
            completedSteps[step.id] = Boolean(fanProfile?.why_i_love_racing);
          }
        });
        
        setCompleted(completedSteps);
        
        // Find first incomplete step
        const firstIncompleteIndex = steps.findIndex(step => !completedSteps[step.id]);
        if (firstIncompleteIndex !== -1) {
          setCurrentStep(firstIncompleteIndex);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  const handleGoToStep = (index: number) => {
    setCurrentStep(index);
    navigate('/settings/profile', { state: { activeField: steps[index].field } });
  };

  const handleCompleteStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    // Award points for completing this step
    try {
      await awardPoints(
        userId,
        step.points,
        'profile_completion',
        stepId,
        `Completed profile step: ${step.title}`
      );
      
      // Mark as completed
      setCompleted(prev => ({
        ...prev,
        [stepId]: true
      }));
      
      // Move to next step if available
      const nextStepIndex = steps.findIndex(s => s.id === stepId) + 1;
      if (nextStepIndex < steps.length) {
        setCurrentStep(nextStepIndex);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Complete Your Profile</h2>
            <p className="text-sm text-gray-400">
              {completedCount === totalSteps 
                ? 'All steps completed! 🎉' 
                : `${completedCount} of ${totalSteps} steps completed`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800">
          <div 
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Steps list */}
        <div className="p-4">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  currentStep === index 
                    ? 'bg-gray-800 border border-orange-500/50' 
                    : 'hover:bg-gray-800/50'
                }`}
                onClick={() => handleGoToStep(index)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  completed[step.id] 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {completed[step.id] ? <CheckCircle className="w-5 h-5" /> : step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${completed[step.id] ? 'text-green-500' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <span className="text-xs text-orange-500">+{step.points} pts</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{step.description}</p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-gray-500 ml-2" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
          
          <button
            onClick={() => handleGoToStep(currentStep)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            {completedCount === totalSteps ? 'View Profile' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
