import { supabase } from './client';
import { FanConnection, FanStats, RacerFan } from './types';

export const getFanStatus = async (fanId: string, racerId: string): Promise<FanConnection | null> => {
    const { data, error } = await supabase
        .from('fan_connections')
        .select('*')
        .eq('fan_id', fanId)
        .eq('racer_id', racerId)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' errors
        console.error('Error fetching fan status:', error);
    }
    return data;
};

export const getFanStats = async (racerId: string): Promise<FanStats | null> => {
    const { data, error } = await supabase
        .rpc('get_racer_fan_stats', { p_racer_id: racerId })
        .single();

    if (error) {
        console.error('Error fetching fan stats:', error);
        return null;
    }
    return data;
};

export const getFansForRacer = async (racerId: string): Promise<RacerFan[]> => {
    const { data, error } = await supabase
        .from('racer_fans_view')
        .select('fan_id, name, profile_picture, created_at, is_superfan')
        .eq('racer_id', racerId);

    if (error) {
        console.error('Error fetching fans for racer:', error);
        return [];
    }
    return data as RacerFan[];
};

export const addFan = async (fanId: string, racerId: string) => {
    const { data, error } = await supabase
        .from('fan_connections')
        .insert([{ fan_id: fanId, racer_id: racerId, became_fan_at: new Date().toISOString() }])
        .select()
        .single();

    if (error) {
        console.error('Error adding fan:', error);
    }
    return data;
};

export const removeFan = async (fanId: string, racerId: string) => {
    const { error } = await supabase
        .from('fan_connections')
        .delete()
        .eq('fan_id', fanId)
        .eq('racer_id', racerId);

    if (error) {
        console.error('Error removing fan:', error);
    }
    return !error;
};

// Backward-compatible aliases for legacy imports
export const becomeFan = addFan;
export const unfollowRacer = removeFan;
export const checkFanStatus = getFanStatus;
export const getRacerFanStats = getFanStats;
export const getRacerFans = getFansForRacer;
