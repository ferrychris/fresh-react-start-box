import { supabase } from '../lib/supabase/client';

/**
 * Manually trigger profile completion check for all existing racers
 * This is useful for migrating existing data to the new completion system
 */
export async function migrateExistingRacerProfiles(): Promise<{
  success: boolean;
  processed: number;
  verified: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let verified = 0;

  try {
    // Get all racer profiles
    const { data: racers, error: racersError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('user_type', 'racer');

    if (racersError) throw racersError;

    if (!racers || racers.length === 0) {
      return { success: true, processed: 0, verified: 0, errors: [] };
    }

    // Process each racer
    for (const racer of racers) {
      try {
        // Trigger the completion check by updating the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', racer.id);

        if (updateError) {
          errors.push(`Failed to update ${racer.name || racer.id}: ${updateError.message}`);
          continue;
        }

        processed++;

        // Check if they got verified
        const { data: updatedProfile, error: checkError } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', racer.id)
          .single();

        if (!checkError && updatedProfile?.is_verified) {
          verified++;
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing ${racer.name || racer.id}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      verified,
      errors
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      processed,
      verified,
      errors: [errorMsg]
    };
  }
}

/**
 * Check completion status for a specific user
 */
export async function checkUserCompletionStatus(userId: string): Promise<{
  isComplete: boolean;
  isVerified: boolean;
  missingFields: string[];
} | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_complete, is_verified, user_type')
      .eq('id', userId)
      .single();

    if (profileError || profile.user_type !== 'racer') return null;

    // Get detailed field status
    const { data: racerProfile, error: racerError } = await supabase
      .from('racer_profiles')
      .select('username, team_name, car_number, racing_class, profile_photo_url, banner_photo_url')
      .eq('id', userId)
      .single();

    if (racerError) return null;

    const missingFields: string[] = [];
    
    if (!profile.name?.trim()) missingFields.push('Display Name');
    if (!profile.avatar?.trim() && !racerProfile.profile_photo_url?.trim()) missingFields.push('Profile Picture');
    if (!profile.banner_image?.trim() && !racerProfile.banner_photo_url?.trim()) missingFields.push('Banner Image');
    if (!racerProfile.username?.trim()) missingFields.push('Username');
    if (!racerProfile.team_name?.trim()) missingFields.push('Team Name');
    if (!racerProfile.car_number?.trim()) missingFields.push('Car Number');
    if (!racerProfile.racing_class?.trim()) missingFields.push('Racing Class');

    return {
      isComplete: profile.profile_complete || false,
      isVerified: profile.is_verified || false,
      missingFields
    };

  } catch (error) {
    console.error('Error checking user completion status:', error);
    return null;
  }
}