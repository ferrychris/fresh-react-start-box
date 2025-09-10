import { supabase } from './client';

const BUCKET_NAME = 'racer-photos';
// Use a single bucket for all post uploads (fans and racers)
const FAN_POST_BUCKET = BUCKET_NAME;

// Generic file upload with retry logic
export const uploadFile = async (bucket: string, path: string, file: File) => {
  console.log(`[DEBUG] uploadFile - Starting upload to bucket: ${bucket}, path: ${path}, file: ${file.name} (${file.size} bytes)`);
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Check if we have a valid session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[DEBUG] uploadFile - Error: No active session');
        return { error: new Error('Authentication required to upload files') };
      }
      console.log(`[DEBUG] uploadFile - Session found for user: ${session.user.id}`);
      
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
      if (error) {
        // Check for specific error types
        if (error.message?.includes('storage/object-not-found') && retries < maxRetries - 1) {
          console.warn(`[DEBUG] uploadFile - Bucket ${bucket} might not exist, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        if (error.message?.includes('Permission denied') || error.message?.includes('policy')) {
          console.error(`[DEBUG] uploadFile - Storage permission error: ${error.message}`);
          return { error: new Error(`Permission denied. Make sure you're logged in and have access to this bucket.`) };
        }
        
        if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
          console.warn(`[DEBUG] uploadFile - Network error, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        console.error(`[DEBUG] uploadFile - Error uploading file to ${bucket}/${path}:`, error);
        return { error };
      }
      
      console.log(`[DEBUG] uploadFile - Upload successful! Bucket: ${bucket}, path: ${path}`);
      return { path };
    } catch (err) {
      if (retries < maxRetries - 1) {
        console.warn(`[DEBUG] uploadFile - Unexpected error uploading file, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      
      console.error('[DEBUG] uploadFile - Exception uploading file:', err);
      return { error: err instanceof Error ? err : new Error('Unknown error uploading file') };
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

// Post image upload for racers
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
  
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${userId}/posts/images/${fileName}`;
  
  console.log(`[DEBUG] uploadPostImage - uploading to path: ${path}`);
  return uploadFile(BUCKET_NAME, path, file);
};

// Post video upload for racers
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
  
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${userId}/posts/videos/${fileName}`;
  
  console.log(`[DEBUG] uploadPostVideo - uploading to path: ${path}`);
  return uploadFile(BUCKET_NAME, path, file);
};

export const uploadImage = async (racerId: string, file: File) => {
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${racerId}/posts/images/${fileName}`;
  
  console.log(`[DEBUG] uploadImage - uploading to path: ${path}`);
  return uploadFile(BUCKET_NAME, path, file);
};

export const uploadVideo = async (racerId: string, file: File) => {
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${racerId}/posts/videos/${fileName}`;
  
  console.log(`[DEBUG] uploadVideo - uploading to path: ${path}`);
  return uploadFile(BUCKET_NAME, path, file);
};

// Fan-specific upload functions
export const uploadFanPostImage = async (userId: string, file: File) => {
  if (!userId) {
    console.error('uploadFanPostImage: No user ID provided');
    return { error: new Error('User ID is required to upload images') };
  }
  if (!file || !(file instanceof File)) {
    console.error('uploadFanPostImage: Invalid file object');
    return { error: new Error('Valid file object is required') };
  }
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { error: new Error('File size exceeds the 10MB limit') };
  }
  
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${userId}/posts/images/${fileName}`;
  
  console.log(`[DEBUG] uploadFanPostImage - uploading to path: ${path}`);
  return uploadFile(FAN_POST_BUCKET, path, file);
};

export const uploadFanPostVideo = async (userId: string, file: File) => {
  if (!userId) {
    console.error('uploadFanPostVideo: No user ID provided');
    return { error: new Error('User ID is required to upload videos') };
  }
  if (!file || !(file instanceof File)) {
    console.error('uploadFanPostVideo: Invalid file object');
    return { error: new Error('Valid file object is required') };
  }
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { error: new Error('File size exceeds the 50MB limit') };
  }
  
  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
  const path = `${userId}/posts/videos/${fileName}`;
  
  console.log(`[DEBUG] uploadFanPostVideo - uploading to path: ${path}`);
  return uploadFile(FAN_POST_BUCKET, path, file);
};

// Persist uploaded image info to avatars table (for avatar/banner images)
export const saveImageToAvatarsTable = async (
  userId: string,
  url: string,
  type: 'avatar' | 'banner',
  originalName?: string
): Promise<{ error: unknown | null }> => {
  try {
    const { error } = await supabase.from('avatars').insert({
      user_id: userId,
      url,
      type,
      original_name: originalName ?? null,
    });
    return { error };
  } catch (err) {
    // Return unknown to avoid leaking any type
    return { error: err as unknown };
  }
};

// Helper: resolve bucket and object path from a possibly-prefixed path
// Supports: "bucket/object", legacy prefixes like "postimage/...", "new_post/...", "racer-photos/..."
const resolveBucketAndPath = (defaultBucket: string, rawPath: string): { bucket: string; objectPath: string } => {
  console.log(`[DEBUG] Resolving path: '${rawPath}' with default bucket: '${defaultBucket}'`);
  
  let p = rawPath.trim();
  // If it's a full URL, try to parse Supabase storage pattern; otherwise return as-is later
  if (/^https?:\/\//i.test(p)) {
    // Example: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<objectPath>?token=...
    const m = p.match(/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)(?:\?|$)/i);
    if (m && m[1] && m[2]) {
      const bucket = m[1];
      const objectPath = m[2];
      console.log(`[DEBUG] Parsed Supabase storage URL. bucket='${bucket}', object='${objectPath}'`);
      return { bucket, objectPath };
    }
    console.log(`[DEBUG] Path is a non-storage URL, returning as-is`);
    return { bucket: defaultBucket, objectPath: p };
  }

  // Remove any leading slashes
  p = p.replace(/^\/+/, '');

  // If path includes an explicit bucket prefix, split it
  // Known fan buckets
  if (p.startsWith('postimage/')) {
    console.log(`[DEBUG] Detected 'postimage/' prefix, using postimage bucket`);
    return { bucket: 'postimage', objectPath: p.substring('postimage/'.length) };
  }
  if (p.startsWith('new_post/')) {
    console.log(`[DEBUG] Detected 'new_post/' prefix, using new_post bucket`);
    return { bucket: 'new_post', objectPath: p.substring('new_post/'.length) };
  }
  // Known racer bucket
  if (p.startsWith('racer-photos/')) {
    console.log(`[DEBUG] Detected 'racer-photos/' prefix, using racer-photos bucket`);
    return { bucket: 'racer-photos', objectPath: p.substring('racer-photos/'.length) };
  }

  // Generic "bucket/object" form
  const firstSlash = p.indexOf('/');
  if (firstSlash > 0) {
    const maybeBucket = p.slice(0, firstSlash);
    const rest = p.slice(firstSlash + 1);
    // Heuristic: if bucket-like (no dots/spaces and reasonable length), treat as bucket
    if (/^[a-z0-9-_]+$/i.test(maybeBucket) && rest.length > 0) {
      console.log(`[DEBUG] Detected generic bucket/object pattern: bucket='${maybeBucket}', object='${rest}'`);
      return { bucket: maybeBucket, objectPath: rest };
    }
  }

  // Fallback: use provided default bucket
  console.log(`[DEBUG] No bucket prefix detected, using default bucket: '${defaultBucket}' with full path: '${p}'`);
  return { bucket: defaultBucket, objectPath: p };
};

export const getPublicUrl = (bucket: string, path: string) => {
  if (!path) return null;
  try {
    // Allow callers to pass either just object path or "bucket/object"
    const { bucket: b, objectPath } = resolveBucketAndPath(bucket, path);
    if (/^https?:\/\//i.test(objectPath)) return objectPath; // already a URL
    const { data } = supabase.storage.from(b).getPublicUrl(objectPath);
    return data.publicUrl;
  } catch (err) {
    console.error(`Error getting public URL for ${bucket}/${path}:`, err);
    return null;
  }
};

export const getPostPublicUrl = (path: string) => {
  if (!path) return null;
  try {
    console.log(`[DEBUG] getPostPublicUrl called with path: '${path}'`);
    const { bucket, objectPath } = resolveBucketAndPath(BUCKET_NAME, path);
    if (/^https?:\/\//i.test(objectPath)) {
      console.log(`[DEBUG] Path is already a URL, returning as-is: ${objectPath}`);
      return objectPath;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    console.log(`[DEBUG] Generated public URL: ${data.publicUrl} from bucket: ${bucket}, path: ${objectPath}`);
    return data.publicUrl;
  } catch (err) {
    console.error(`Error getting public URL for ${BUCKET_NAME}/${path}:`, err);
    return null;
  }
};

export const getFanPostPublicUrl = (path: string) => {
  if (!path) return null;
  try {
    console.log(`[DEBUG] getFanPostPublicUrl called with path: '${path}'`);
    const { bucket, objectPath } = resolveBucketAndPath(FAN_POST_BUCKET, path);
    if (/^https?:\/\//i.test(objectPath)) {
      console.log(`[DEBUG] Path is already a URL, returning as-is: ${objectPath}`);
      return objectPath;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    console.log(`[DEBUG] Generated public URL: ${data.publicUrl} from bucket: ${bucket}, path: ${objectPath}`);
    return data.publicUrl;
  } catch (err) {
    console.error(`Error getting public URL for ${FAN_POST_BUCKET}/${path}:`, err);
    return null;
  }
};
