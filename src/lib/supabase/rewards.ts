import { supabase } from './client';

export interface FanRewards {
  points: {
    current: number;
    totalEarned: number;
    totalSpent: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActivity: string | null;
    freezeCount: number;
  };
  badges: Badge[];
  favorites: FavoriteItem[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface FavoriteItem {
  id: string;
  targetType: 'racer' | 'post' | 'track' | 'series';
  targetId: string;
  favoriteLevel: number;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  pointsChange: number;
  transactionType: 'comment' | 'like' | 'tip' | 'subscription' | 'badge' | 'redeem';
  description: string;
  createdAt: string;
}

// Point values for different actions
export const POINT_VALUES = {
  comment: 2,
  like: 1,
  tip: 5,
  subscription: 50,
  daily_login: 3,
  badge_common: 10,
  badge_rare: 25,
  badge_epic: 50,
  badge_legendary: 100
};

// Streak rewards by milestone
export const STREAK_REWARDS = {
  7: { points: 25, title: 'Week Warrior' },
  30: { points: 100, title: 'Month Master' },
  50: { points: 200, title: 'Consistency King' },
  100: { points: 500, title: 'Century Club' },
  365: { points: 1000, title: 'Year Champion' }
};

export const getFanRewards = async (fanId: string): Promise<FanRewards> => {
  try {
    // Get points
    const { data: pointsData } = await supabase
      .from('fan_points')
      .select('*')
      .eq('fan_id', fanId)
      .single();

    // Get streak
    const { data: streakData } = await supabase
      .from('fan_streaks')
      .select('*')
      .eq('fan_id', fanId)
      .single();

    // Get badges
    const { data: badgesData } = await supabase
      .from('fan_badges')
      .select(`
        badge_definitions (
          id,
          name,
          description,
          icon_emoji,
          rarity
        ),
        earned_at
      `)
      .eq('fan_id', fanId);

    // Get favorites
    const { data: favoritesData } = await supabase
      .from('fan_favorites')
      .select('*')
      .eq('fan_id', fanId)
      .order('created_at', { ascending: false });

    return {
      points: {
        current: pointsData?.current_points || 0,
        totalEarned: pointsData?.total_earned || 0,
        totalSpent: pointsData?.total_spent || 0
      },
      streak: {
        current: streakData?.current_streak || 0,
        longest: streakData?.longest_streak || 0,
        lastActivity: streakData?.last_activity_date || null,
        freezeCount: streakData?.streak_freeze_count || 0
      },
      badges: badgesData?.map(item => ({
        id: item.badge_definitions.id,
        name: item.badge_definitions.name,
        description: item.badge_definitions.description,
        iconEmoji: item.badge_definitions.icon_emoji,
        rarity: item.badge_definitions.rarity,
        earnedAt: item.earned_at
      })) || [],
      favorites: favoritesData?.map(item => ({
        id: item.id,
        targetType: item.target_type,
        targetId: item.target_id,
        favoriteLevel: item.favorite_level,
        createdAt: item.created_at
      })) || []
    };
  } catch (error) {
    console.error('Error fetching fan rewards:', error);
    return {
      points: { current: 0, totalEarned: 0, totalSpent: 0 },
      streak: { current: 0, longest: 0, lastActivity: null, freezeCount: 0 },
      badges: [],
      favorites: []
    };
  }
};

export const getPointTransactions = async (fanId: string): Promise<PointTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('fan_point_transactions')
      .select('*')
      .eq('fan_id', fanId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data?.map(item => ({
      id: item.id,
      pointsChange: item.points_change,
      transactionType: item.transaction_type,
      description: item.description || '',
      createdAt: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching point transactions:', error);
    return [];
  }
};

export const awardPoints = async (
  fanId: string,
  points: number,
  transactionType: string,
  referenceId?: string,
  description?: string
) => {
  try {
    const { error } = await supabase
      .rpc('award_points', {
        p_fan_id: fanId,
        p_points: points,
        p_transaction_type: transactionType,
        p_reference_id: referenceId,
        p_description: description
      });

    if (error) throw error;

    // Update streak and check badges
    await Promise.all([
      supabase.rpc('update_activity_streak', { p_fan_id: fanId }),
      supabase.rpc('check_and_award_badges', { p_fan_id: fanId })
    ]);

    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
};

export const addToFavorites = async (
  fanId: string,
  targetType: 'racer' | 'post' | 'track' | 'series',
  targetId: string,
  favoriteLevel: number = 1
) => {
  try {
    const { error } = await supabase
      .from('fan_favorites')
      .upsert({
        fan_id: fanId,
        target_type: targetType,
        target_id: targetId,
        favorite_level: favoriteLevel
      });

    if (error) throw error;

    // Award points for favoriting
    await awardPoints(fanId, 3, 'favorite', targetId, `Added ${targetType} to favorites`);

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

export const removeFromFavorites = async (
  fanId: string,
  targetType: 'racer' | 'post' | 'track' | 'series',
  targetId: string
) => {
  try {
    const { error } = await supabase
      .from('fan_favorites')
      .delete()
      .eq('fan_id', fanId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

export const getAllBadges = async () => {
  try {
    const { data, error } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all badges:', error);
    return [];
  }
};