import React, { useEffect, useRef, useState } from 'react';
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
  const [userType, setUserType] = useState<'fan' | 'racer' | 'track' | 'series' | 'admin' | null>(null);

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  // Track original URLs from database to avoid writing blob: URLs if user doesn't save new files
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [originalBannerUrl, setOriginalBannerUrl] = useState<string | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const bannerObjectUrlRef = useRef<string | null>(null);

  // Fan-specific fields
  const [fanLocation, setFanLocation] = useState<string>('');
  const [fanFavClasses, setFanFavClasses] = useState<string>('');
  const [fanFavTracks, setFanFavTracks] = useState<string>('');
  const [fanWhy, setFanWhy] = useState<string>('');

  // Racer-specific fields
  const [racerUsername, setRacerUsername] = useState<string>('');
  const [racerTeam, setRacerTeam] = useState<string>('');
  const [racerCarNum, setRacerCarNum] = useState<string>('');
  const [racerClass, setRacerClass] = useState<string>('');

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
          setUserType(p.user_type);
          const avatarFromDb = p.avatar && p.avatar.startsWith('blob:') ? null : (p.avatar || null);
          const bannerFromDb = p.banner_image && p.banner_image.startsWith('blob:') ? null : (p.banner_image || null);
          setAvatarPreview(avatarFromDb);
          setBannerPreview(bannerFromDb);
          setOriginalAvatarUrl(avatarFromDb);
          setOriginalBannerUrl(bannerFromDb);
        }

        // Load type-specific profile
        try {
          if (data?.user_type === 'fan') {
            const { data: fan, error: fanErr } = await supabase
              .from('fan_profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (!fanErr && fan) {
              setFanLocation(fan.location || '');
              setFanFavClasses(Array.isArray(fan.favorite_classes) ? fan.favorite_classes.join(', ') : '');
              setFanFavTracks(Array.isArray(fan.favorite_tracks) ? fan.favorite_tracks.join(', ') : '');
              setFanWhy(fan.why_i_love_racing || '');
            }
          } else if (data?.user_type === 'racer') {
            const { data: racer, error: racerErr } = await supabase
              .from('racer_profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (!racerErr && racer) {
              setRacerUsername(racer.username || '');
              setRacerTeam(racer.team_name || '');
              setRacerCarNum(racer.car_number ? String(racer.car_number) : '');
              setRacerClass(racer.racing_class || '');
            }
          }
        } catch (typeErr) {
          // Non-fatal; table may not exist yet
          console.log('Type-specific profile load skipped:', typeErr);
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

  // Defensive handler: if a preview image fails to load (stale blob, etc), revoke and clear it
  const handlePreviewError = (type: 'avatar' | 'banner') => () => {
    if (type === 'avatar') {
      if (avatarObjectUrlRef.current) {
        try { URL.revokeObjectURL(avatarObjectUrlRef.current); } catch (err) { /* noop */ }
        avatarObjectUrlRef.current = null;
      }
      setAvatarPreview(null);
      setAvatarFile(null);
    } else {
      if (bannerObjectUrlRef.current) {
        try { URL.revokeObjectURL(bannerObjectUrlRef.current); } catch (err) { /* noop */ }
        bannerObjectUrlRef.current = null;
      }
      setBannerPreview(null);
      setBannerFile(null);
    }
  };

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

      // Compute final URLs; do not persist blob: preview URLs
      let newAvatarUrl = originalAvatarUrl;
      let newBannerUrl = originalBannerUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        // Path must start with the authenticated user's id to satisfy RLS
        const path = `${userId}/avatar.${ext}`;
        newAvatarUrl = await uploadToStorage('avatars', path, avatarFile);
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        // Path must start with the authenticated user's id to satisfy RLS
        const path = `${userId}/banner.${ext}`;
        newBannerUrl = await uploadToStorage('avatars', path, bannerFile);
      }

      type ProfileUpdates = { name: string; updated_at: string } & Partial<Pick<Profile, 'avatar' | 'banner_image'>>;
      const updates: ProfileUpdates = {
        name,
        updated_at: new Date().toISOString(),
      };
      if (typeof newAvatarUrl === 'string') updates.avatar = newAvatarUrl;
      if (typeof newBannerUrl === 'string') updates.banner_image = newBannerUrl;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateErr) throw updateErr;

      // Save type-specific profile
      try {
        if (userType === 'fan') {
          const fanPayload: Record<string, unknown> = {
            id: userId,
            location: fanLocation || null,
            favorite_classes: fanFavClasses
              ? fanFavClasses.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            favorite_tracks: fanFavTracks
              ? fanFavTracks.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            why_i_love_racing: fanWhy || null,
          };
          // keep profile photo in sync if we uploaded a new avatar
          if (typeof newAvatarUrl === 'string') fanPayload.profile_photo_url = newAvatarUrl;
          await supabase.from('fan_profiles').upsert(fanPayload, { onConflict: 'id' });
        } else if (userType === 'racer') {
          const racerPayload: Record<string, unknown> = {
            id: userId,
            username: racerUsername || null,
            team_name: racerTeam || null,
            car_number: racerCarNum ? Number(racerCarNum) : null,
            racing_class: racerClass || null,
          };
          if (typeof newAvatarUrl === 'string') racerPayload.profile_photo_url = newAvatarUrl;
          if (typeof newBannerUrl === 'string') racerPayload.banner_photo_url = newBannerUrl;
          await supabase.from('racer_profiles').upsert(racerPayload, { onConflict: 'id' });
        }
      } catch (typeSaveErr) {
        console.log('Type-specific profile save skipped:', typeSaveErr);
      }

      setSuccess('Profile updated successfully');
      setAvatarFile(null);
      setBannerFile(null);
      setOriginalAvatarUrl(newAvatarUrl || null);
      setOriginalBannerUrl(newBannerUrl || null);

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
      // Revoke previous object URL if any to prevent leaks and stale refs
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      const url = URL.createObjectURL(f);
      avatarObjectUrlRef.current = url;
      setAvatarPreview(url);
    }
  };

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setBannerFile(f);
      // Revoke previous object URL if any
      if (bannerObjectUrlRef.current) {
        URL.revokeObjectURL(bannerObjectUrlRef.current);
        bannerObjectUrlRef.current = null;
      }
      const url = URL.createObjectURL(f);
      bannerObjectUrlRef.current = url;
      setBannerPreview(url);
    }
  };

  // Cleanup any object URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      if (bannerObjectUrlRef.current) {
        URL.revokeObjectURL(bannerObjectUrlRef.current);
        bannerObjectUrlRef.current = null;
      }
    };
  }, []);

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
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" onError={handlePreviewError('banner')} />
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
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" onError={handlePreviewError('avatar')} />
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

            {/* Type-specific fields */}
            {userType === 'fan' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={fanLocation}
                    onChange={(e) => setFanLocation(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="City, State/Country"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Favorite classes (comma separated)</label>
                  <input
                    type="text"
                    value={fanFavClasses}
                    onChange={(e) => setFanFavClasses(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="e.g. Late Model, Sprint, Modified"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Favorite tracks (comma separated)</label>
                  <input
                    type="text"
                    value={fanFavTracks}
                    onChange={(e) => setFanFavTracks(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="e.g. Eldora, Knoxville, Bristol"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Why I love racing</label>
                  <textarea
                    value={fanWhy}
                    onChange={(e) => setFanWhy(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500 min-h-[80px]"
                    placeholder="Share your racing story..."
                  />
                </div>
              </div>
            )}

            {userType === 'racer' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={racerUsername}
                    onChange={(e) => setRacerUsername(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="racer123"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Team name</label>
                  <input
                    type="text"
                    value={racerTeam}
                    onChange={(e) => setRacerTeam(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="Team Lightning"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Car number</label>
                  <input
                    type="text"
                    value={racerCarNum}
                    onChange={(e) => setRacerCarNum(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="#24"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Racing class</label>
                  <input
                    type="text"
                    value={racerClass}
                    onChange={(e) => setRacerClass(e.target.value)}
                    className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                    placeholder="Late Model"
                  />
                </div>
              </div>
            )}

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
