import { supabase } from './client';
import { SubscriptionTier } from './types';

export const getSubscriptionTiers = async (racerId: string): Promise<SubscriptionTier[]> => {
    const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('racer_id', racerId)
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

    if (error) {
        console.error('Error fetching subscription tiers:', error);
        return [];
    }
    return data as SubscriptionTier[];
};
