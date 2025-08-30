
import { supabase } from './client';
import { FanStats, FanSubscription, FanActivity } from './types';

export const getFanStats = async (fanId: string): Promise<FanStats> => {
  try {
    const { data, error } = await supabase.rpc('get_fan_stats', { fan_id: fanId });
    
    if (error) {
      console.error('Error fetching fan stats:', error);
      // Return default stats structure
      return {
        total_fans: 0,
        super_fans: 0,
        top_superfan_id: undefined,
        top_superfan_name: undefined,
        top_superfan_total: undefined
      };
    }

    return data as FanStats;
  } catch (error) {
    console.error('Error in getFanStats:', error);
    return {
      total_fans: 0,
      super_fans: 0,
      top_superfan_id: undefined,
      top_superfan_name: undefined,
      top_superfan_total: undefined
    };
  }
};

export const getFanSubscriptions = async (fanId: string): Promise<FanSubscription[]> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', fanId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching fan subscriptions:', error);
      return [];
    }

    return data as FanSubscription[];
  } catch (error) {
    console.error('Error in getFanSubscriptions:', error);
    return [];
  }
};

export const getFanActivity = async (fanId: string): Promise<FanActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('fan_activity')
      .select('*')
      .eq('fan_id', fanId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching fan activity:', error);
      return [];
    }

    return data as FanActivity[];
  } catch (error) {
    console.error('Error in getFanActivity:', error);
    return [];
  }
};

export const getFanNotifications = async (fanId: string) => {
  return getNotifications(fanId);
};

// Import getNotifications from notifications module
import { getNotifications } from './notifications';
