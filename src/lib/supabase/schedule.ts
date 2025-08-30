import { supabase } from './client';
import { RaceSchedule } from './types';

export const getScheduleForRacer = async (racerId: string): Promise<RaceSchedule[]> => {
    const { data, error } = await supabase
        .from('racer_schedule')
        .select('*')
        .eq('racer_id', racerId)
        .order('event_date', { ascending: true });

    if (error) {
        console.error('Error fetching schedule for racer:', error);
        return [];
    }
    return data as RaceSchedule[];
};

// Insert a new race schedule entry
export const addRaceSchedule = async (
  payload: Partial<RaceSchedule> & {
    event_name: string;
    track_name: string;
    event_date: string; // ISO date (YYYY-MM-DD)
    racer_id?: string;
    track_id?: string;
  }
): Promise<RaceSchedule | null> => {
  try {
    const insertRow = {
      ...payload,
      created_at: new Date().toISOString(),
    } as any;

    const { data, error } = await supabase
      .from('racer_schedule')
      .insert([insertRow])
      .select('*')
      .single();

    if (error) {
      console.error('Error adding race schedule:', error);
      return null;
    }
    return data as RaceSchedule;
  } catch (e) {
    console.error('Unexpected error in addRaceSchedule:', e);
    return null;
  }
};
