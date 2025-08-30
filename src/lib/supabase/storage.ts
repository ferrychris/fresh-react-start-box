import { supabase } from './client';

const BUCKET_NAME = 'racer-photos';

// Generic file upload
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }
  return data;
};

// Generic file deletion
export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Error deleting file:', error);
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

export const uploadPostImage = async (userId: string, file: File) => {
  // Store images under postimage bucket with user ID and timestamp
  const path = `${userId}/posts/images/${Date.now()}-${file.name}`;
  return uploadFile('postimage', path, file);
};

export const uploadPostVideo = async (userId: string, file: File) => {
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
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

export const getPostPublicUrl = (path: string) => {
    if (!path) return null;
    const { data } = supabase.storage.from('postimage').getPublicUrl(path);
    return data.publicUrl;
};
