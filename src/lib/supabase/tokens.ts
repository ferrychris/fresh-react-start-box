
import { supabase } from './client';
import { UserTokens, VirtualGift } from './types';

export const getUserTokens = async (userId: string): Promise<UserTokens | null> => {
  try {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user tokens:', error);
      return null;
    }

    return data as UserTokens;
  } catch (error) {
    console.error('Error in getUserTokens:', error);
    return null;
  }
};

export const getVirtualGifts = async (): Promise<VirtualGift[]> => {
  try {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('*')
      .eq('is_active', true)
      .order('token_cost', { ascending: true });

    if (error) {
      console.error('Error fetching virtual gifts:', error);
      return [];
    }

    return data as VirtualGift[];
  } catch (error) {
    console.error('Error in getVirtualGifts:', error);
    return [];
  }
};

export const updateTokenBalance = async (userId: string, amount: number, operation: 'add' | 'subtract' = 'add') => {
  try {
    const { data, error } = await supabase.rpc('update_token_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_operation: operation
    });

    if (error) {
      console.error('Error updating token balance:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTokenBalance:', error);
    throw error;
  }
};
