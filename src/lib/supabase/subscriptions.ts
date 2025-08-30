
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

export const createSubscriptionTier = async (tier: Omit<SubscriptionTier, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
        .from('subscription_tiers')
        .insert([tier])
        .select()
        .single();

    if (error) {
        console.error('Error creating subscription tier:', error);
        throw error;
    }
    return data;
};

export const updateSubscriptionTier = async (id: string, updates: Partial<SubscriptionTier>) => {
    const { data, error } = await supabase
        .from('subscription_tiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating subscription tier:', error);
        throw error;
    }
    return data;
};

export const getRacerSubscriptionTiers = async (racerId: string) => {
    return getSubscriptionTiers(racerId);
};
