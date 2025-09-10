import { supabase } from '../lib/supabase/client';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completedFields: string[];
  missingFields: string[];
  completionPercentage: number;
  shouldVerify: boolean;
}

export interface RacerProfileData {
  // Basic profile fields
  name?: string;
  avatar?: string;
  banner_image?: string;
  
  // Racer-specific fields
  username?: string;
  team_name?: string;
  car_number?: string;
  racing_class?: string;
  profile_photo_url?: string;
  banner_photo_url?: string;
  // New completion requirements
  bio?: string | null;
  car_photos?: unknown;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
}

// Required fields for racer verification (base fields)
const REQUIRED_FIELDS_BASE = [
  'name',
  'avatar',
  'banner_image', 
  'username',
  'team_name',
  'car_number',
  'racing_class'
] as const;

const FIELD_LABELS: Record<string, string> = {
  name: 'Display Name',
  avatar: 'Profile Picture',
  banner_image: 'Banner Image',
  username: 'Username',
  team_name: 'Team Name',
  car_number: 'Car Number',
  racing_class: 'Racing Class',
  bio: 'Bio',
  car_photos: 'Car Photo',
  social_link: 'Social Link'
};

/**
 * Check if a field value is considered complete
 */
function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Analyze profile completion status for a racer
 */
export function analyzeProfileCompletion(profileData: RacerProfileData): ProfileCompletionStatus {
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  // Check each required field
  REQUIRED_FIELDS_BASE.forEach(field => {
    const value = profileData[field];
    if (isFieldComplete(value)) {
      completedFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  // New: Bio
  if (isFieldComplete(profileData.bio)) {
    completedFields.push('bio');
  } else {
    missingFields.push('bio');
  }

  // New: At least one car photo (car_photos as JSON array)
  const photos = Array.isArray(profileData.car_photos) ? profileData.car_photos : [];
  if (Array.isArray(photos) && photos.length > 0) {
    completedFields.push('car_photos');
  } else {
    missingFields.push('car_photos');
  }

  // New: At least one social link
  const socialLinks = [
    profileData.instagram_url,
    profileData.facebook_url,
    profileData.tiktok_url,
    profileData.youtube_url
  ];
  const hasAnySocial = socialLinks.some(u => typeof u === 'string' && u.trim() !== '');
  if (hasAnySocial) {
    completedFields.push('social_link');
  } else {
    missingFields.push('social_link');
  }

  const totalRequired = REQUIRED_FIELDS_BASE.length + 3; // base + bio + car_photos + social_link
  const completionPercentage = Math.round((completedFields.length / totalRequired) * 100);
  const isComplete = missingFields.length === 0;
  const shouldVerify = isComplete;

  return {
    isComplete,
    completedFields,
    missingFields,
    completionPercentage,
    shouldVerify
  };
}

/**
 * Get human-readable field labels for missing fields
 */
export function getMissingFieldLabels(missingFields: string[]): string[] {
  return missingFields.map(field => FIELD_LABELS[field] || field);
}

/**
 * Fetch current profile data for completion analysis
 */
export async function fetchProfileCompletionData(userId: string): Promise<RacerProfileData | null> {
  try {
    // Get basic profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, avatar, banner_image, user_type')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (profile.user_type !== 'racer') return null;

    // Get racer-specific data (include new fields)
    const { data: racerProfile, error: racerError } = await supabase
      .from('racer_profiles')
      .select('username, team_name, car_number, racing_class, profile_photo_url, banner_photo_url, bio, car_photos, instagram_url, facebook_url, tiktok_url, youtube_url')
      .eq('id', userId)
      .single();

    if (racerError) throw racerError;

    return {
      name: profile.name,
      avatar: profile.avatar || racerProfile.profile_photo_url,
      banner_image: profile.banner_image || racerProfile.banner_photo_url,
      username: racerProfile.username,
      team_name: racerProfile.team_name,
      car_number: racerProfile.car_number,
      racing_class: racerProfile.racing_class,
      profile_photo_url: racerProfile.profile_photo_url,
      banner_photo_url: racerProfile.banner_photo_url,
      bio: racerProfile.bio ?? null,
      car_photos: racerProfile.car_photos ?? [],
      instagram_url: racerProfile.instagram_url ?? null,
      facebook_url: racerProfile.facebook_url ?? null,
      tiktok_url: racerProfile.tiktok_url ?? null,
      youtube_url: racerProfile.youtube_url ?? null
    };
  } catch (error) {
    console.error('Error fetching profile completion data:', error);
    return null;
  }
}

/**
 * Update profile completion status and verification in database
 */
export async function updateProfileCompletionStatus(
  userId: string, 
  status: ProfileCompletionStatus
): Promise<boolean> {
  try {
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        profile_complete: status.isComplete,
        is_verified: status.shouldVerify,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return true;
  } catch (error) {
    console.error('Error updating profile completion status:', error);
    return false;
  }
}

/**
 * Check and update profile completion after profile changes
 * Optimized to avoid stack depth limit errors
 */
export async function checkAndUpdateCompletion(userId: string): Promise<ProfileCompletionStatus | null> {
  try {
    // Direct SQL query to check profile completion in a single operation
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        name,
        avatar,
        banner_image,
        user_type,
        racer_profiles!inner(
          username,
          team_name,
          car_number,
          racing_class,
          profile_photo_url,
          banner_photo_url,
          bio,
          car_photos,
          instagram_url,
          facebook_url,
          tiktok_url,
          youtube_url
        )
      `)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    if (data.user_type !== 'racer') return null;
    
    // Flatten the data structure
    const profileData: RacerProfileData = {
      name: data.name,
      avatar: data.avatar || data.racer_profiles.profile_photo_url,
      banner_image: data.banner_image || data.racer_profiles.banner_photo_url,
      username: data.racer_profiles.username,
      team_name: data.racer_profiles.team_name,
      car_number: data.racer_profiles.car_number,
      racing_class: data.racer_profiles.racing_class,
      bio: data.racer_profiles.bio ?? null,
      car_photos: data.racer_profiles.car_photos ?? [],
      instagram_url: data.racer_profiles.instagram_url ?? null,
      facebook_url: data.racer_profiles.facebook_url ?? null,
      tiktok_url: data.racer_profiles.tiktok_url ?? null,
      youtube_url: data.racer_profiles.youtube_url ?? null
    };
    
    // Analyze completion without deep recursion
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    
    // Check each required field
    for (const field of REQUIRED_FIELDS_BASE) {
      const value = profileData[field];
      if (isFieldComplete(value)) {
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }

    // Bio
    if (isFieldComplete(profileData.bio)) {
      completedFields.push('bio');
    } else {
      missingFields.push('bio');
    }

    // Car Photos
    const photos2 = Array.isArray(profileData.car_photos) ? profileData.car_photos : [];
    if (Array.isArray(photos2) && photos2.length > 0) {
      completedFields.push('car_photos');
    } else {
      missingFields.push('car_photos');
    }

    // Social Link
    const socialAny = [
      profileData.instagram_url,
      profileData.facebook_url,
      profileData.tiktok_url,
      profileData.youtube_url
    ].some((u) => typeof u === 'string' && u.trim() !== '');
    if (socialAny) {
      completedFields.push('social_link');
    } else {
      missingFields.push('social_link');
    }

    const totalRequired2 = REQUIRED_FIELDS_BASE.length + 3;
    const completionPercentage = Math.round((completedFields.length / totalRequired2) * 100);
    const isComplete = missingFields.length === 0;
    
    const status: ProfileCompletionStatus = {
      isComplete,
      completedFields,
      missingFields,
      completionPercentage,
      shouldVerify: isComplete
    };
    
    // Update profile status in a single operation
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_complete: isComplete,
        is_verified: isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    return status;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return null;
  }
}

/**
 * Get completion progress message
 */
export function getCompletionMessage(status: ProfileCompletionStatus): string {
  if (status.isComplete) {
    return "🎉 Profile complete! You're now verified as a racer.";
  }
  
  const missing = getMissingFieldLabels(status.missingFields);
  const remaining = missing.length;
  
  if (remaining === 1) {
    return `Almost there! Just add your ${missing[0]} to get verified.`;
  }
  
  return `${remaining} fields remaining: ${missing.join(', ')}`;
}