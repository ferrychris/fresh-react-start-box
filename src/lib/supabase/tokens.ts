import { supabase } from './client';

export const TOKEN_PACKAGES = [
    { tokens: 100, price: 0.99, popular: false },
    { tokens: 550, price: 4.99, popular: true },
    { tokens: 1200, price: 9.99, popular: false },
    { tokens: 2500, price: 19.99, popular: false },
];

export const getUserTokens = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user tokens:', error);
        return 0;
    }

    return data?.tokens || 0;
};

export const getVirtualGifts = async () => {
    const { data, error } = await supabase.from('virtual_gifts').select('*');

    if (error) {
        console.error('Error fetching virtual gifts:', error);
        return [];
    }

    return data;
};

export const processTokenPurchase = async (userId: string, sessionId: string, tokenAmount: number) => {
  // Check if this purchase has already been processed
  const { data: existingPurchase, error: checkError } = await supabase
    .from('token_purchases')
    .select('id, status')
    .eq('stripe_payment_intent_id', sessionId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.warn('Error checking existing purchase:', checkError);
  }

  // If purchase already exists and is completed, just return
  if (existingPurchase && existingPurchase.status === 'completed') {
    console.log('Purchase already processed, skipping update.');
    return { success: true };
  }

  // If purchase exists but not completed, update it
  if (existingPurchase && existingPurchase.status !== 'completed') {
    const { error: updateError } = await supabase
      .from('token_purchases')
      .update({
        status: 'completed',
        token_amount: tokenAmount
      })
      .eq('id', existingPurchase.id);

    if (updateError) {
      console.warn('Failed to update existing purchase:', updateError);
    }
  } else if (!existingPurchase) {
    // Record the token purchase (only if it doesn't exist)
    const { error: purchaseError } = await supabase
      .from('token_purchases')
      .insert({
        user_id: userId,
        token_amount: tokenAmount,
        price_cents: 0, // Already paid via Stripe
        stripe_payment_intent_id: sessionId,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (purchaseError) {
      console.warn('Failed to record token purchase:', purchaseError);
      // Don't fail the whole process for purchase recording
    }
  }

  // Add tokens to user's account using the database function (only if not already processed)
  if (!existingPurchase || existingPurchase.status !== 'completed') {
    const { error: balanceError } = await supabase
      .rpc('update_token_balance', {
        p_user_id: userId,
        p_amount: tokenAmount,
        p_operation: 'add'
      });

    if (balanceError) {
      console.error('Error updating token balance:', balanceError);
      throw balanceError;
    }
  }
  
  return { success: true };
};
