
import { supabase } from '../supabase/client';

export interface UserTokens {
  id: string;
  user_id: string;
  token_balance: number;
  total_purchased: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  token_amount: number;
  price_cents: number;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export const getUserTokens = async (userId: string): Promise<UserTokens | null> => {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user tokens:', error);
    return null;
  }
  return data;
};

export const updateTokenBalance = async (userId: string, amount: number, operation: 'add' | 'subtract' = 'add') => {
  const { data, error } = await supabase
    .rpc('update_token_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_operation: operation
    });
  
  if (error) {
    console.error('Error updating token balance:', error);
    throw error;
  }
  return data;
};

export const createTokenPurchase = async (purchase: Omit<TokenPurchase, 'id' | 'created_at' | 'updated_at'>): Promise<TokenPurchase> => {
  const { data, error } = await supabase
    .from('token_purchases')
    .insert([purchase])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating token purchase:', error);
    throw error;
  }
  return data;
};

export const processTokenPurchase = async (purchaseId: string, status: 'completed' | 'failed') => {
  const { data: purchase, error: fetchError } = await supabase
    .from('token_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching token purchase:', fetchError);
    throw fetchError;
  }
  
  // Update purchase status
  const { error: updateError } = await supabase
    .from('token_purchases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', purchaseId);
  
  if (updateError) {
    console.error('Error updating token purchase status:', updateError);
    throw updateError;
  }
  
  // If completed, add tokens to user balance
  if (status === 'completed') {
    await updateTokenBalance(purchase.user_id, purchase.token_amount, 'add');
  }
  
  return purchase;
};

export const getTokenPurchaseHistory = async (userId: string): Promise<TokenPurchase[]> => {
  const { data, error } = await supabase
    .from('token_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting token purchase history:', error);
    return [];
  }
  return data || [];
};
