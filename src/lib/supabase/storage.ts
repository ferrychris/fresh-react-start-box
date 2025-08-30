import { supabase } from './client';

const BUCKET_NAME = 'racer-photos';

// Generic file upload with retry logic
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Check if we have a valid session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Error uploading file: No active session');
        return { error: new Error('Authentication required to upload files') };
      }
      
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
      if (error) {
        // Check for specific error types
        if (error.message?.includes('storage/object-not-found') && retries < maxRetries - 1) {
          console.warn(`Bucket ${bucket} might not exist, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        if (error.message?.includes('Permission denied') || error.message?.includes('policy')) {
          console.error(`Storage permission error: ${error.message}`);
          return { error: new Error(`Permission denied. Make sure you're logged in and have access to this bucket.`) };
        }
        
        if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
          console.warn(`Network error, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        console.error(`Error uploading file to ${bucket}/${path}:`, error);
        return { error };
      }
      
      return data;
    } catch (err) {
      if (retries < maxRetries - 1) {
        console.warn(`Unexpected error, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      console.error('Exception during file upload:', err);
      return { error: err };
    }
  }
  
  return { error: new Error('Maximum retries reached during file upload') };
};

// Generic file deletion with improved error handling
export const deleteFile = async (bucket: string, path: string) => {
  try {
    // Check if we have a valid session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Error deleting file: No active session');
      return { error: new Error('Authentication required to delete files') };
    }
    
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Error deleting file from ${bucket}/${path}:`, error);
      return { error };
    }
    return { error: null };
  } catch (err) {
    console.error('Exception during file deletion:', err);
    return { error: err };
  }
};

// Specific upload functions
export const uploadRacerProfilePhoto = async (racerId: string, file: File) => {
  const path = `${racerId}/profile/${file.name}`;
  return uploadFile(BUCKET_NAME, path, file);
};

export const uploadRacerBannerPhoto = async (racerId: string, file: File) => {
  const path = `${racerId}/banner/${file.name}`;
  return uploadFile(BUCKET_NAME, path, file);
};

export const uploadRacerCarPhotos = async (racerId: string, files: File[]) => {
  const uploadPromises = files.map(file => {
    const path = `${racerId}/cars/${file.name}`;
    return uploadFile(BUCKET_NAME, path, file);
  });
  const results = await Promise.all(uploadPromises);
  return results.filter(result => result !== null);
};

export const deleteRacerCarPhoto = async (photoUrl: string) => {
    // Extract path from URL
    try {
        const url = new URL(photoUrl);
        const path = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
        if (path) {
            await deleteFile(BUCKET_NAME, path);
        } else {
            console.error('Could not determine file path from URL for deletion.');
        }
    } catch (error) {
        console.error('Invalid photo URL:', photoUrl, error);
    }
};

// Improve post image upload with better error handling
export const uploadPostImage = async (userId: string, file: File) => {
  if (!userId) {
    console.error('uploadPostImage: No user ID provided');
    return { error: new Error('User ID is required to upload images') };
  }
  
  if (!file || !(file instanceof File)) {
    console.error('uploadPostImage: Invalid file object');
    return { error: new Error('Valid file object is required') };
  }
  
  // Validate file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    console.error(`File too large: ${file.size} bytes (max: ${MAX_SIZE} bytes)`);
    return { error: new Error(`File size exceeds the 10MB limit`) };
  }
  
  // Store images under postimage bucket with user ID and timestamp
  const path = `${userId}/posts/images/${Date.now()}-${file.name}`;
  return uploadFile('postimage', path, file);
};

// Improve post video upload with better error handling
export const uploadPostVideo = async (userId: string, file: File) => {
  if (!userId) {
    console.error('uploadPostVideo: No user ID provided');
    return { error: new Error('User ID is required to upload videos') };
  }
  
  if (!file || !(file instanceof File)) {
    console.error('uploadPostVideo: Invalid file object');
    return { error: new Error('Valid file object is required') };
  }
  
  // Validate file size (50MB limit)
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    console.error(`File too large: ${file.size} bytes (max: ${MAX_SIZE} bytes)`);
    return { error: new Error(`File size exceeds the 50MB limit`) };
  }
  
  // Store videos under postimage bucket with user ID and timestamp
  const path = `${userId}/posts/videos/${Date.now()}-${file.name}`;
  return uploadFile('postimage', path, file);
};

export const uploadImage = async (racerId: string, file: File) => {
  // Store images under posts/images with a timestamp to avoid name collisions
  const path = `${racerId}/posts/images/${Date.now()}-${file.name}`;
  return uploadFile(BUCKET_NAME, path, file);
};

export const uploadVideo = async (racerId: string, file: File) => {
  // Store videos under posts/videos with a timestamp to avoid name collisions
  const path = `${racerId}/posts/videos/${Date.now()}-${file.name}`;
  return uploadFile(BUCKET_NAME, path, file);
};

// Persist uploaded image info to avatars table (for avatar/banner images)
export const saveImageToAvatarsTable = async (
  userId: string,
  url: string,
  type: 'avatar' | 'banner',
  originalName?: string
): Promise<{ error: any | null }> => {
  try {
    const { error } = await supabase.from('avatars').insert({
      user_id: userId,
      url,
      type,
      original_name: originalName ?? null,
    });
    return { error };
  } catch (err) {
    return { error: err };
  }
};

export const getPublicUrl = (bucket: string, path: string) => {
  if (!path) return null;
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error(`Error getting public URL for ${bucket}/${path}:`, err);
    return null;
  }
};

export const getPostPublicUrl = (path: string) => {
  if (!path) return null;
  try {
    const { data } = supabase.storage.from('postimage').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error(`Error getting public URL for postimage/${path}:`, err);
    return null;
  }
};
