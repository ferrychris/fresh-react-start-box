import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: 'fan' | 'racer' | 'track' | 'series' | 'admin';
  avatar: string | null;
  banner_image: string | null;
}

const SettingsProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be signed in to edit your profile.');
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (profErr) throw profErr;

        if (data) {
          const p = data as Profile;
          setName(p.name || '');
          setAvatarPreview(p.avatar || null);
          setBannerPreview(p.banner_image || null);
        }
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Failed to load profile';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const uploadToStorage = async (bucket: string, path: string, file: File): Promise<string> => {
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });
    if (uploadErr) throw uploadErr;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let newAvatarUrl = avatarPreview;
      let newBannerUrl = bannerPreview;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `profiles/${userId}-avatar.${ext}`;
        newAvatarUrl = await uploadToStorage('avatars', path, avatarFile);
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `profiles/${userId}-banner.${ext}`;
        newBannerUrl = await uploadToStorage('profilebaner', path, bannerFile);
      }

      const updates = {
        name,
        avatar: newAvatarUrl,
        banner_image: newBannerUrl,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateErr) throw updateErr;

      setSuccess('Profile updated successfully');
      setAvatarFile(null);
      setBannerFile(null);

      // small delay, then navigate back
      setTimeout(() => navigate(-1), 800);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Failed to save profile';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setBannerFile(f);
      setBannerPreview(URL.createObjectURL(f));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-900/30 border border-red-800 text-red-200 rounded p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

      {/* Banner uploader */}
      <div className="mb-6">
        <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
          {bannerPreview ? (
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No banner image</div>
          )}
          <div className="absolute bottom-3 right-3">
            <label className="inline-flex items-center px-3 py-2 bg-gray-900/80 hover:bg-gray-900 text-white text-sm rounded cursor-pointer border border-gray-700">
              <input type="file" accept="image/*" className="hidden" onChange={onBannerChange} />
              Upload Banner
            </label>
          </div>
        </div>
      </div>

      {/* Avatar and basic info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-gray-700 bg-gray-800">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">No avatar</div>
              )}
            </div>
            <div className="mt-3">
              <label className="inline-flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded cursor-pointer border border-gray-700">
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                Upload Avatar
              </label>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              placeholder="Your name"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-800"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {success && (
              <div className="mt-3 text-sm text-green-400">{success}</div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Images are stored in a public bucket. Avoid uploading sensitive content.
      </p>
    </div>
  );
};

export default SettingsProfile;
