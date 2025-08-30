import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../App';
import { supabase } from '../../lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trophy, Users, Heart, Activity, Settings } from 'lucide-react';
import IndexPost from './posts/indexpost';

// Define types for our data structures
interface FanProfile {
  id: string;
  username?: string;
  name: string;
  avatar_url?: string;
  avatar?: string | null;
  banner_image?: string | null;
  fan_type?: string;
  user_type?: string;
  created_at: string;
  email: string;
  profile_complete: boolean;
  updated_at: string;
  avatars?: string | null;
}

interface FanStats {
  support_points: number;
  total_tips: number;
  active_subscriptions: number;
  activity_streak: number;
}

interface Racer {
  id: string;
  name: string;
  avatarUrl: string;
  flag: string;
  lastTipped: string | null;
  totalTipped: number;
  subscription: string | null;
  nextRace: {
    track: string;
    date: string;
  };
}

interface ActivityItem {
  id: string;
  type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
  timestamp: string;
  timeAgo: string;
  content: string;
  metadata: {
    racerId?: string;
    racerName?: string;
    amount?: number;
    badgeName?: string;
    postId?: string;
    postContent?: string;
    commentContent?: string;
    likes?: number;
  };
}

const ModernFanDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const navigate = useNavigate();
  
  // Use user ID if no ID parameter or if ID is placeholder
  const fanId = (id && id !== ':id') ? id : user?.id;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [stats, setStats] = useState<FanStats>({
    support_points: 0,
    total_tips: 0,
    active_subscriptions: 0,
    activity_streak: 0
  });
  const [favoriteRacers, setFavoriteRacers] = useState<Racer[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const loadFanProfile = useCallback(async () => {
    if (!fanId) return;
    
    try {
      setLoading(true);
      
      // Load fan profile data
      const { data: fanData, error: fanError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', fanId)
        .maybeSingle();
      
      if (fanError) throw fanError;
      
      if (fanData) {
        setFanProfile({
          ...fanData,
          username: fanData.name || 'user',
          avatar_url: fanData.avatar || fanData.avatars || '',
          fan_type: fanData.user_type || 'Racing Fan'
        });
      }
      
      // Load stats with error handling
      try {
        const { data: statsData } = await supabase
          .from('fan_stats')
          .select('*')
          .eq('fan_id', fanId)
          .maybeSingle();
        
        if (statsData) {
          setStats(statsData);
        }
      } catch (error) {
        console.log('Stats table may not exist:', error);
      }
      
      // Load sample data for favorite racers and activity
      setFavoriteRacers([
        {
          id: '1',
          name: 'Sarah Johnson',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          flag: '🇺🇸',
          lastTipped: '2024-01-15',
          totalTipped: 150,
          subscription: 'VIP',
          nextRace: { track: 'Speedway', date: '2024-02-01' }
        },
        {
          id: '2',
          name: 'Mike Rodriguez',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          flag: '🇲🇽',
          lastTipped: '2024-01-10',
          totalTipped: 75,
          subscription: 'Fan',
          nextRace: { track: 'Thunder Valley', date: '2024-01-30' }
        }
      ]);
      
      setRecentActivity([
        {
          id: '1',
          type: 'tip',
          timestamp: new Date().toISOString(),
          timeAgo: '2 hours ago',
          content: '',
          metadata: {
            racerId: '1',
            racerName: 'Sarah Johnson',
            amount: 25
          }
        },
        {
          id: '2',
          type: 'subscription',
          timestamp: new Date().toISOString(),
          timeAgo: '1 day ago',
          content: '',
          metadata: {
            racerId: '2',
            racerName: 'Mike Rodriguez'
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error loading fan profile:', error);
    } finally {
      setLoading(false);
    }
  }, [fanId]);

  useEffect(() => {
    loadFanProfile();
  }, [loadFanProfile]);

  const isOwnProfile = user?.id === fanId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!fanProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Fan not found</h2>
            <p className="text-muted-foreground">The fan profile you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Hero Section with Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
        {bannerImage && (
          <img 
            src={bannerImage} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-4">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-lg">
              <AvatarImage src={fanProfile.avatar_url || fanProfile.avatar || ''} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {fanProfile.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {fanProfile.name}
                </h1>
                <Badge variant="secondary" className="w-fit">
                  {fanProfile.fan_type || 'Racing Fan'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  {stats.activity_streak} day streak
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {favoriteRacers.length} supported racers
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {stats.support_points} support points
                </span>
              </div>
            </div>
            
            {isOwnProfile && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings/profile')}
                className="shrink-0"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="backdrop-blur-sm bg-card/90">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.support_points}</div>
              <div className="text-sm text-muted-foreground">Support Points</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-card/90">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">${stats.total_tips}</div>
              <div className="text-sm text-muted-foreground">Total Tips</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-card/90">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.active_subscriptions}</div>
              <div className="text-sm text-muted-foreground">Subscriptions</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-card/90">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.activity_streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-flex mb-6">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs md:text-sm">Posts</TabsTrigger>
            <TabsTrigger value="racers" className="text-xs md:text-sm">Racers</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm">Activity</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs md:text-sm">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Favorite Racers */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Supported Racers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {favoriteRacers.map((racer) => (
                        <div key={racer.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={racer.avatarUrl} />
                              <AvatarFallback>{racer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{racer.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Last tipped: {racer.lastTipped || 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={racer.subscription === 'VIP' ? 'default' : 'secondary'}>
                              {racer.subscription}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              ${racer.totalTipped} total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {activity.type === 'tip' ? '💰' : '⭐'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              {activity.type === 'tip' 
                                ? `Tipped $${activity.metadata.amount} to ${activity.metadata.racerName}`
                                : `Subscribed to ${activity.metadata.racerName}`
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <IndexPost />
          </TabsContent>

          <TabsContent value="racers">
            <Card>
              <CardHeader>
                <CardTitle>All Supported Racers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteRacers.map((racer) => (
                    <div key={racer.id} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={racer.avatarUrl} />
                          <AvatarFallback>{racer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{racer.name}</h4>
                          <p className="text-sm text-muted-foreground">{racer.flag}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total tipped:</span>
                          <span className="font-medium">${racer.totalTipped}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subscription:</span>
                          <Badge variant="outline">{racer.subscription}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Next race:</span>
                          <span className="text-xs">{racer.nextRace.track}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <Avatar>
                        <AvatarFallback>
                          {activity.type === 'tip' ? '💰' : activity.type === 'subscription' ? '⭐' : '🏆'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.type === 'tip' 
                            ? `Tipped $${activity.metadata.amount} to ${activity.metadata.racerName}`
                            : activity.type === 'subscription'
                            ? `Subscribed to ${activity.metadata.racerName}`
                            : `Earned badge: ${activity.metadata.badgeName}`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badges & Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No badges yet</h3>
                  <p className="text-muted-foreground">
                    Start supporting racers and engaging with the community to earn badges!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernFanDashboard;