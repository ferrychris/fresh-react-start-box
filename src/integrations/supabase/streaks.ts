import { supabase } from './client';

// Utilities for maintaining daily activity streaks in fan_streaks table
// Schema (from types): fan_streaks { fan_id, current_streak, longest_streak, last_activity_date, created_at, updated_at }

function startOfUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUTC(a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = startOfUTC(a).getTime() - startOfUTC(b).getTime();
  return Math.floor(diff / msPerDay);
}

export async function getFanStreak(fanId: string) {
  if (!fanId) return { data: null, error: new Error('Missing fanId') };
  const { data, error } = await supabase
    .from('fan_streaks')
    .select('fan_id, current_streak, longest_streak, last_activity_date')
    .eq('fan_id', fanId)
    .maybeSingle();
  return { data, error };
}

export async function recordActivityForStreak(fanId: string) {
  if (!fanId) return { error: new Error('Missing fanId') };

  try {
    const today = new Date();
    
    // First check if a streak record exists
    const { data: existing } = await supabase
      .from('fan_streaks')
      .select('fan_id, current_streak, longest_streak, last_activity_date')
      .eq('fan_id', fanId)
      .maybeSingle();
    
    if (!existing) {
      // No record exists, create a new one
      await supabase.from('fan_streaks').insert({
        fan_id: fanId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today.toISOString(),
      });
      return { error: null };
    }
    
    // Record exists, update based on time since last activity
    const last = existing.last_activity_date ? new Date(existing.last_activity_date) : null;
    const delta = last ? daysBetweenUTC(today, last) : Infinity;
    
    // Already counted today, no update needed
    if (delta === 0) return { error: null };
    
    let nextCurrent = existing.current_streak || 0;
    
    if (Number.isFinite(delta) && delta > 1) {
      // Missed (delta - 1) days -> subtract that many from current streak, floor at 0
      const missed = delta - 1;
      nextCurrent = Math.max(0, nextCurrent - missed);
    }
    
    // Add today's activity (+1)
    nextCurrent = nextCurrent + 1;
    const nextLongest = Math.max(existing.longest_streak || 0, nextCurrent);
    
    // Update the streak
    await supabase
      .from('fan_streaks')
      .update({
        current_streak: nextCurrent,
        longest_streak: nextLongest,
        last_activity_date: today.toISOString(),
      })
      .eq('fan_id', fanId);
    
    return { error: null };
  } catch (err) {
    console.error('Error updating streak:', err);
    return { error: err instanceof Error ? err : new Error('Unknown error updating streak') };
  }
}
