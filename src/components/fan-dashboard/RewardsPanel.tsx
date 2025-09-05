import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Star, Flame, Gift, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getFanRewards, getPointTransactions, type FanRewards, type PointTransaction } from '../../lib/supabase/rewards';
import { useApp } from '../../contexts/AppContext';

interface RewardsPanelProps {
  fanId?: string;
  isOwnProfile?: boolean;
}

export const RewardsPanel: React.FC<RewardsPanelProps> = ({ fanId, isOwnProfile = false }) => {
  const { user } = useApp();
  const targetId = fanId || user?.id;
  
  const [rewards, setRewards] = useState<FanRewards>({
    points: { current: 0, totalEarned: 0, totalSpent: 0 },
    streak: { current: 0, longest: 0, lastActivity: null, freezeCount: 0 },
    badges: [],
    favorites: []
  });
  
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetId) {
      loadRewards();
    }
  }, [targetId]);

  const loadRewards = async () => {
    if (!targetId) return;
    
    try {
      setLoading(true);
      const [rewardsData, transactionsData] = await Promise.all([
        getFanRewards(targetId),
        getPointTransactions(targetId)
      ]);
      
      setRewards(rewardsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStreakReward = (streak: number) => {
    if (streak >= 100) return { points: 500, emoji: '💎', title: 'Century Club' };
    if (streak >= 30) return { points: 100, emoji: '🏆', title: 'Month Master' };
    if (streak >= 7) return { points: 25, emoji: '🔥', title: 'Week Warrior' };
    return null;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const streakReward = getStreakReward(rewards.streak.current);

  return (
    <div className="space-y-6">
      {/* Points & Streak Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Points</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{rewards.points.current.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {rewards.points.totalEarned.toLocaleString()} earned total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{rewards.streak.current} days</div>
            <p className="text-xs text-muted-foreground">
              Best: {rewards.streak.longest} days
            </p>
            {streakReward && (
              <div className="mt-2 text-xs text-orange-300">
                {streakReward.emoji} {streakReward.title}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{rewards.badges.length}</div>
            <p className="text-xs text-muted-foreground">
              {rewards.favorites.length} favorites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Rewards Tabs */}
      <Tabs defaultValue="points" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Point System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">How to Earn Points:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>💬 Comment</span>
                      <span className="text-yellow-400">+2 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>❤️ Like Post</span>
                      <span className="text-yellow-400">+1 pt</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💰 Send Tip</span>
                      <span className="text-yellow-400">+5 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⭐ Subscribe</span>
                      <span className="text-yellow-400">+50 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔥 Daily Login</span>
                      <span className="text-yellow-400">+3 pts</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Point Stats:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Current</span>
                      <span className="text-green-400">{rewards.points.current.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earned</span>
                      <span className="text-blue-400">{rewards.points.totalEarned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Spent</span>
                      <span className="text-red-400">{rewards.points.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="text-sm">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">{formatTimeAgo(transaction.createdAt)}</div>
                      </div>
                      <div className={`font-medium ${transaction.pointsChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.pointsChange > 0 ? '+' : ''}{transaction.pointsChange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Activity Streaks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-2">
                    {rewards.streak.current}
                  </div>
                  <div className="text-sm text-muted-foreground">Days Current Streak</div>
                  {rewards.streak.lastActivity && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last activity: {new Date(rewards.streak.lastActivity).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Streak Milestones */}
                <div className="space-y-3">
                  <h4 className="font-medium">Streak Milestones</h4>
                  {[
                    { days: 7, reward: 25, title: 'Week Warrior', emoji: '🔥' },
                    { days: 30, reward: 100, title: 'Month Master', emoji: '🏆' },
                    { days: 50, reward: 200, title: 'Consistency King', emoji: '👑' },
                    { days: 100, reward: 500, title: 'Century Club', emoji: '💎' },
                    { days: 365, reward: 1000, title: 'Year Champion', emoji: '🌟' }
                  ].map((milestone) => {
                    const isAchieved = rewards.streak.longest >= milestone.days;
                    const progress = Math.min((rewards.streak.current / milestone.days) * 100, 100);
                    
                    return (
                      <div key={milestone.days} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{milestone.emoji}</span>
                            <span className="text-sm font-medium">{milestone.title}</span>
                            <Badge variant={isAchieved ? "default" : "secondary"}>
                              {milestone.days} days
                            </Badge>
                          </div>
                          <div className="text-sm text-yellow-400">+{milestone.reward} pts</div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                <div className="bg-muted/50 p-3 rounded">
                  <div className="text-sm font-medium mb-1">Streak Protection</div>
                  <div className="text-xs text-muted-foreground">
                    You have {rewards.streak.freezeCount} streak freezes available. 
                    Use them to maintain your streak if you miss a day!
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Badge Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards.badges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Start engaging to earn your first badge!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {rewards.badges.map((badge) => (
                    <div key={badge.id} className="bg-muted/50 p-4 rounded-lg text-center space-y-2">
                      <div className="text-3xl">{badge.iconEmoji}</div>
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-xs text-muted-foreground">{badge.description}</div>
                      <Badge className={getBadgeColor(badge.rarity)}>
                        {badge.rarity}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Earned {formatTimeAgo(badge.earnedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards.favorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No favorites yet</p>
                  <p className="text-sm">Start favoriting racers, posts, and tracks!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.favorites.map((favorite) => (
                    <div key={favorite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-sm capitalize font-medium">{favorite.targetType}</div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < favorite.favoriteLevel
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(favorite.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};