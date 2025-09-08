import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, CheckCircle, AlertCircle, Users, Trophy } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  migrateExistingRacerProfiles, 
  checkUserCompletionStatus 
} from '../utils/profileCompletionMigration';
import { checkAndUpdateCompletion } from '../utils/profileCompletion';

export const ProfileCompletionTester: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [testUserId, setTestUserId] = useState('');
  const [userStatus, setUserStatus] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(false);

  const handleMigration = async () => {
    try {
      setLoading(true);
      setMigrationResult(null);
      
      const result = await migrateExistingRacerProfiles();
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: "Migration Complete!",
          description: `Processed ${result.processed} racers, ${result.verified} got verified.`,
        });
      } else {
        toast({
          title: "Migration Issues",
          description: `Processed ${result.processed} racers with ${result.errors.length} errors.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: "An error occurred during migration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserCheck = async () => {
    if (!testUserId.trim()) {
      toast({
        title: "User ID Required",
        description: "Please enter a user ID to check.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckingUser(true);
      setUserStatus(null);

      // First check current status
      const currentStatus = await checkUserCompletionStatus(testUserId);
      
      // Then trigger a fresh check
      const updatedStatus = await checkAndUpdateCompletion(testUserId);

      setUserStatus({
        current: currentStatus,
        updated: updatedStatus
      });

      if (updatedStatus?.isComplete) {
        toast({
          title: "User Verified!",
          description: "This user has a complete profile and is verified.",
        });
      } else {
        toast({
          title: "Profile Incomplete",
          description: `Missing ${updatedStatus?.missingFields.length || 0} required fields.`,
        });
      }
    } catch (error) {
      console.error('User check error:', error);
      toast({
        title: "Check Failed",
        description: "An error occurred while checking the user.",
        variant: "destructive",
      });
    } finally {
      setCheckingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Profile Completion System Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Migration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Migrate Existing Racers</h3>
            <p className="text-slate-400 text-sm">
              Run this to check and update completion status for all existing racer profiles.
            </p>
            <Button
              onClick={handleMigration}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Run Migration
                </>
              )}
            </Button>

            {/* Migration Results */}
            {migrationResult && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {migrationResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  )}
                  <span className="text-white font-medium">Migration Results</span>
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Processed: {migrationResult.processed} racers</p>
                  <p>Verified: {migrationResult.verified} racers</p>
                  <p>Errors: {migrationResult.errors.length}</p>
                  {migrationResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-400">Error Details:</p>
                      <ul className="list-disc list-inside text-xs text-red-300">
                        {migrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Individual User Check */}
          <div className="space-y-4 border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white">Check Individual User</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="userId" className="text-slate-300">User ID</Label>
                <Input
                  id="userId"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="Enter user ID to check..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleUserCheck}
                  disabled={checkingUser}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {checkingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check User'
                  )}
                </Button>
              </div>
            </div>

            {/* User Status Results */}
            {userStatus && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {userStatus.updated?.isComplete ? (
                    <Trophy className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  )}
                  <span className="text-white font-medium">User Status</span>
                </div>
                
                {userStatus.current && (
                  <div className="text-sm text-slate-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400">Profile Complete:</p>
                        <p className={userStatus.current.isComplete ? 'text-green-400' : 'text-orange-400'}>
                          {userStatus.current.isComplete ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Verified:</p>
                        <p className={userStatus.current.isVerified ? 'text-green-400' : 'text-orange-400'}>
                          {userStatus.current.isVerified ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    
                    {userStatus.current.missingFields.length > 0 && (
                      <div>
                        <p className="text-slate-400 mb-1">Missing Fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {userStatus.current.missingFields.map((field) => (
                            <span 
                              key={field}
                              className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};