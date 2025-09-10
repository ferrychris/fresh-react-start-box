import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Trophy, Star } from 'lucide-react';
import { 
  ProfileCompletionStatus, 
  fetchProfileCompletionData, 
  analyzeProfileCompletion,
  getMissingFieldLabels,
  getCompletionMessage
} from '../utils/profileCompletion';

interface ProfileCompletionProgressProps {
  userId: string;
  onCompletionChange?: (status: ProfileCompletionStatus) => void;
  showDetails?: boolean;
}

export const ProfileCompletionProgress: React.FC<ProfileCompletionProgressProps> = ({
  userId,
  onCompletionChange,
  showDetails = true
}) => {
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  // Only show loading when we actually have a userId to look up
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    const checkCompletion = async () => {
      try {
        setLoading(true);
        const profileData = await fetchProfileCompletionData(userId);
        if (profileData) {
          const completionStatus = analyzeProfileCompletion(profileData);
          setStatus(completionStatus);
          onCompletionChange?.(completionStatus);
        } else {
          setStatus(null);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!userId) {
      // No user ID, nothing to load; ensure we don't stay in loading state
      setStatus(null);
      setLoading(false);
      return;
    }

    checkCompletion();
  }, [userId]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400">Checking profile completion...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <span className="text-slate-400 text-sm">Profile info will appear once you start filling in your details.</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (status.isComplete) return 'text-green-400';
    if (status.completionPercentage >= 75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getStatusIcon = () => {
    if (status.isComplete) return <Trophy className="w-5 h-5 text-green-400" />;
    if (status.completionPercentage >= 75) return <Star className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-orange-400" />;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-white">
          {getStatusIcon()}
          Profile Completion
          {status.isComplete && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">
              {status.completedFields.length} of {status.completedFields.length + status.missingFields.length} fields complete
            </span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {status.completionPercentage}%
            </span>
          </div>
          <Progress 
            value={status.completionPercentage} 
            className="h-2"
          />
        </div>

        {/* Status Message */}
        <div className={`text-sm ${getStatusColor()}`}>
          {getCompletionMessage(status)}
        </div>

        {/* Detailed Field Status */}
        {showDetails && (
          <div className="space-y-3">
            {/* Completed Fields */}
            {status.completedFields.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getMissingFieldLabels(status.completedFields).map((field) => (
                    <Badge 
                      key={field}
                      className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields */}
            {status.missingFields.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Still Needed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getMissingFieldLabels(status.missingFields).map((field) => (
                    <Badge 
                      key={field}
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Status */}
        {status.isComplete && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">
                Congratulations! You're now a verified racer.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};