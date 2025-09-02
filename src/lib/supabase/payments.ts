import { supabase } from './client';

interface CreatePaymentSessionParams {
  amount: number;
  postId: string;
  userId: string;
  racerId: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

export const createPaymentSession = async (params: CreatePaymentSessionParams) => {
  try {
    const amountCents = Math.round(params.amount * 100);
    
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        mode: 'payment',
        amountCents,
        user_id: params.userId,
        racerId: params.racerId,
        type: 'tip',
        description: params.description || `Tip for post ${params.postId}`,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl
      }
    });

    if (error) throw error;
    
    return {
      success: true,
      checkoutUrl: data.url
    };
  } catch (error) {
    console.error('Payment error:', error);
    return { success: false, error };
  }
};
