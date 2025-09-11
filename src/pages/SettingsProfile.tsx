import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Camera, User, MapPin, Heart, Trophy, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { ProfileCompletionProgress } from '../components/ProfileCompletionProgress';
import { checkAndUpdateCompletion } from '../utils/profileCompletion';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'fan' | 'racer' | 'track' | 'series' | 'admin' | null>(null);

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
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
  // Basic Identity (new)
  const [bio, setBio] = useState<string>('');
  const [hometown, setHometown] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  // Visual Branding (new)
  const [mainSponsorLogoPreview, setMainSponsorLogoPreview] = useState<string | null>(null);
  const [mainSponsorLogoFile, setMainSponsorLogoFile] = useState<File | null>(null);
  const [carPhotoPreviews, setCarPhotoPreviews] = useState<string[]>([]);
  const [carPhotoFiles, setCarPhotoFiles] = useState<File[]>([]);
  // Career & Stats (new)
  const [careerWins, setCareerWins] = useState<number>(0);
  const [podiums, setPodiums] = useState<number>(0);
  const [championships, setChampionships] = useState<number>(0);
  const [yearsRacing, setYearsRacing] = useState<number>(0);
  const [careerHistory, setCareerHistory] = useState<string>('');
  const [highlights, setHighlights] = useState<string>('');
  const [achievements, setAchievements] = useState<string>('');
  const [achievementOne, setAchievementOne] = useState<string>('');
  const [achievementTwo, setAchievementTwo] = useState<string>('');
  const [achievementsList, setAchievementsList] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string>('');
  // Monetization & Fan Support (new)
  const [monetizationEnabled, setMonetizationEnabled] = useState<boolean>(false);
  const [supportTiers, setSupportTiers] = useState<Array<{ name: string; price: number; description: string }>>([]);
  const [thankYouMessage, setThankYouMessage] = useState<string>('');
  // Social Links (new)
  const [instagramUrl, setInstagramUrl] = useState<string>('');
  const [facebookUrl, setFacebookUrl] = useState<string>('');
  const [tiktokUrl, setTiktokUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [otherSocials, setOtherSocials] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "You must be signed in to edit your profile.",
            variant: "destructive",
          });
          navigate('/');
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
              // Load new basic identity fields
              setBio(racer.bio || '');
              setHometown(racer.hometown || '');
              setPhone(racer.phone || '');
              // Load Visual Branding (Main Sponsor Logo removed)
              if (Array.isArray(racer.car_photos)) {
                const photos = (racer.car_photos as string[]).filter((u) => typeof u === 'string');
                setCarPhotoPreviews(photos);
              }
              // Load Career & Stats
              setCareerWins(typeof racer.career_wins === 'number' ? racer.career_wins : 0);
              setPodiums(typeof racer.podiums === 'number' ? racer.podiums : 0);
              setChampionships(typeof racer.championships === 'number' ? racer.championships : 0);
              setYearsRacing(typeof racer.years_racing === 'number' ? racer.years_racing : 0);
              setCareerHistory(racer.career_history || '');
              setHighlights(racer.highlights || '');
              const ach = (racer.achievements as string) || '';
              if (ach) {
                const parts = ach.split(/\r?\n|,\s*/).filter(Boolean);
                setAchievementOne(parts[0] || '');
                setAchievementTwo(parts[1] || '');
                setAchievements(ach);
                setAchievementsList(parts);
              } else {
                setAchievementOne('');
                setAchievementTwo('');
                setAchievements('');
                setAchievementsList([]);
              }
              // Load Monetization & Social
              setMonetizationEnabled(!!racer.monetization_enabled);
              setSupportTiers(Array.isArray(racer.support_tiers)
                ? (racer.support_tiers as Array<{ name?: string; price?: number | string; description?: string }>).map((t) => ({
                    name: (t?.name ?? '') as string,
                    price: typeof t?.price === 'number' ? (t.price as number) : (parseFloat(String(t?.price)) || 0),
                    description: (t?.description ?? '') as string
                  }))
                : []);
              setThankYouMessage(racer.thank_you_message || '');
              setInstagramUrl(racer.instagram_url || '');
              setFacebookUrl(racer.facebook_url || '');
              setTiktokUrl(racer.tiktok_url || '');
              setYoutubeUrl(racer.youtube_url || '');
              if (racer.social_links && typeof racer.social_links === 'object') {
                setOtherSocials(racer.social_links as Record<string, string>);
              } else {
                setOtherSocials({});
              }
            }
          }
        } catch (typeErr) {
          console.log('Type-specific profile load skipped:', typeErr);
        }
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Failed to load profile';
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, toast]);

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
    // Defensive: ensure we have a userId
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
        } else {
          toast({ title: 'Not Signed In', description: 'Please sign in to save your profile.', variant: 'destructive' });
          return;
        }
      } catch (err) {
        console.error('Failed to get auth user before save', err);
        toast({ title: 'Save Error', description: 'Could not verify your session. Please sign in again.', variant: 'destructive' });
        return;
      }
    }
    try {
      setSaving(true);
      console.debug('Saving profile...', { userId, userType });

      // Step 1: Handle file uploads first
      let newAvatarUrl = originalAvatarUrl;
      let newBannerUrl = originalBannerUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${userId}/avatar.${ext}`;
        newAvatarUrl = await uploadToStorage('avatars', path, avatarFile);
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${userId}/banner.${ext}`;
        newBannerUrl = await uploadToStorage('avatars', path, bannerFile);
      }

      // Step 2: Prepare profile updates
      const profileUpdates = {
        name,
        updated_at: new Date().toISOString(),
        ...(typeof newAvatarUrl === 'string' ? { avatar: newAvatarUrl } : {}),
        ...(typeof newBannerUrl === 'string' ? { banner_image: newBannerUrl } : {}),
      };

      // Step 3: Transactions are not supported directly via supabase-js; proceed with sequential updates

      // Step 4: Update profiles table with minimal data
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name: name,
          ...(typeof newAvatarUrl === 'string' ? { avatar: newAvatarUrl } : {}),
          ...(typeof newBannerUrl === 'string' ? { banner_image: newBannerUrl } : {}),
        })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      // Step 5: Update type-specific profile in a separate operation
      try {
        if (userType === 'fan') {
          const fanPayload = {
            id: userId,
            location: fanLocation || null,
            favorite_classes: fanFavClasses
              ? fanFavClasses.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            favorite_tracks: fanFavTracks
              ? fanFavTracks.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            why_i_love_racing: fanWhy || null,
            profile_photo_url: typeof newAvatarUrl === 'string' ? newAvatarUrl : null,
          };
          const { error: fanUpsertError } = await supabase.from('fan_profiles').upsert(fanPayload, { onConflict: 'id' });
          if (fanUpsertError) throw fanUpsertError;
          // Early success toast (sooner feedback)
          toast({
            title: 'Settings Saved ✅',
            description: 'Your profile changes have been saved.',
            duration: 3000,
          });
        } else if (userType === 'racer') {
          // Compute car photos: keep existing remote URLs that are still shown, and add newly uploaded files
          const keptRemoteUrls = (carPhotoPreviews || []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
          let uploadedCarUrls: string[] = [];
          if (carPhotoFiles.length > 0) {
            const uploads = carPhotoFiles.map(async (file, idx) => {
              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
              const path = `${userId}/branding/car_photos/${Date.now()}_${idx}.${ext}`;
              return uploadToStorage('racer-photos', path, file);
            });
            uploadedCarUrls = await Promise.all(uploads);
          }
          const carPhotoUrls = [...keptRemoteUrls, ...uploadedCarUrls];

          // Normalize support tiers to safe JSON objects for PostgREST
          const normalizedSupportTiers = Array.isArray(supportTiers)
            ? supportTiers.map((t) => {
                const rawPrice = (t as { price?: number | string }).price;
                const priceNum = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice ?? '')) || 0);
                return {
                  name: typeof t?.name === 'string' ? t.name : '',
                  price: priceNum,
                  description: typeof t?.description === 'string' ? t.description : ''
                };
              })
            : [];

          const racerPayload = {
            id: userId,
            username: racerUsername || null,
            team_name: racerTeam || null,
            car_number: racerCarNum || null,
            racing_class: racerClass || null,
            profile_photo_url: typeof newAvatarUrl === 'string' ? newAvatarUrl : null,
            banner_photo_url: typeof newBannerUrl === 'string' ? newBannerUrl : null,
            // New basic identity fields
            bio: bio || null,
            hometown: hometown || null,
            // phone is NOT NULL in DB, provide empty string if missing
            phone: (typeof phone === 'string' && phone.trim().length > 0) ? phone : '',
            // Visual branding (Main Sponsor Logo removed)
            car_photos: carPhotoUrls,
            // Career & Stats
            career_wins: careerWins,
            podiums: podiums,
            championships: championships,
            years_racing: yearsRacing,
            career_history: careerHistory || null,
            highlights: highlights || null,
            achievements: (achievementsList.filter(Boolean).join('\n')) || null,
            // Monetization & Fan Support
            monetization_enabled: monetizationEnabled,
            support_tiers: normalizedSupportTiers,
            thank_you_message: thankYouMessage || null,
            // Social Links
            instagram_url: instagramUrl || null,
            facebook_url: facebookUrl || null,
            tiktok_url: tiktokUrl || null,
            youtube_url: youtubeUrl || null,
            social_links: otherSocials,
          };
          const { data: racerUpsertData, error: racerUpsertError, status: racerUpsertStatus } = await supabase
            .from('racer_profiles')
            .upsert(racerPayload, { onConflict: 'id' })
            .select();
          if (racerUpsertError) {
            console.error('racer_profiles upsert error:', {
              message: racerUpsertError.message,
              details: racerUpsertError.details,
              hint: racerUpsertError.hint,
              code: racerUpsertError.code,
              status: racerUpsertStatus,
              payload: racerPayload,
            });
            throw new Error(`racer_profiles save failed: ${racerUpsertError.message}`);
          }
          // Early success toast (sooner feedback)
          toast({
            title: 'Settings Saved ✅',
            description: 'Your racer profile has been saved.',
            duration: 3000,
          });
        }
      } catch (typeSaveErr) {
        console.error('Type-specific profile save error:', typeSaveErr);
        toast({
          title: 'Save Error',
          description: typeSaveErr instanceof Error ? typeSaveErr.message : 'Failed to save type-specific profile data',
          variant: 'destructive',
        });
      }

      // Step 6: Update profile completion status directly instead of using checkAndUpdateCompletion
      if (userType === 'racer') {
        try {
          // Check if all required fields are filled
          const hasCarPhoto = Array.isArray(carPhotoPreviews) && carPhotoPreviews.length > 0;
          const hasAnySocial = [instagramUrl, facebookUrl, tiktokUrl, youtubeUrl]
            .some(u => typeof u === 'string' && u.trim() !== '');
          const hasBio = typeof bio === 'string' && bio.trim() !== '';
          const baseFieldsFilled = [
            name,
            newAvatarUrl,
            newBannerUrl,
            racerUsername,
            racerTeam,
            racerCarNum,
            racerClass
          ].every(field => field && String(field).trim() !== '');
          const isComplete = baseFieldsFilled && hasCarPhoto && hasAnySocial && hasBio;
          
          // Update profile_complete and is_verified directly
          await supabase
            .from('profiles')
            .update({
              profile_complete: isComplete,
              is_verified: isComplete
            })
            .eq('id', userId);
          
          if (isComplete) {
            toast({
              title: "Profile Complete! 🎉",
              description: "You're now verified as a racer. Your profile is complete!",
              duration: 5000,
            });
          } 
        } catch (completionErr) {
          console.error('Error updating completion status:', completionErr);
          // Completion update failed but save already succeeded; keep page with earlier success toast.
        }
      } else {
        // Non-racer: early success toast already shown above
      }

      setAvatarFile(null);
      setBannerFile(null);
      setOriginalAvatarUrl(newAvatarUrl || null);
      setOriginalBannerUrl(newBannerUrl || null);

      console.log('Profile saved successfully!');
      toast({
        title: 'Success',
        description: 'Profile saved successfully!',
        variant: 'success',
      });
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Failed to save profile';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
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
      if (bannerObjectUrlRef.current) {
        URL.revokeObjectURL(bannerObjectUrlRef.current);
        bannerObjectUrlRef.current = null;
      }
      const url = URL.createObjectURL(f);
      bannerObjectUrlRef.current = url;
      setBannerPreview(url);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 bg-slate-900/80 border-b border-slate-800/70">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-white">Edit Profile</h1>
              <p className="text-xs text-slate-400">Update your public profile details, media, and links</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="hidden md:inline-flex border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Profile Completion Progress - Only for racers */}
        {userType === 'racer' && userId && (
          <div className="mb-6">
            <ProfileCompletionProgress 
              userId={userId}
              onCompletionChange={(status) => {
                if (status.isComplete) {
                  toast({
                    title: "Profile Complete!",
                    description: "You're now verified as a racer. Great job!",
                  });
                }
              }}
            />
          </div>
        )}

        

        {/* Banner Card */}
        <Card className="bg-slate-900/60 border-slate-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)] mb-6">
          <CardContent className="p-0">
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700">
              {bannerPreview ? (
                <img 
                  src={bannerPreview} 
                  alt="Banner" 
                  className="w-full h-full object-cover" 
                  onError={handlePreviewError('banner')} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No banner image</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 right-4">
                <Label htmlFor="banner-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg border border-slate-600 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    Upload Banner
                  </div>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onBannerChange}
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Profile Card */}
        <Card className="bg-slate-900/60 border-slate-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Avatar and Name Section */}
            <div className="flex items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-slate-700 shadow-inner shadow-black/40">
                  <AvatarImage 
                    src={avatarPreview || undefined} 
                    onError={handlePreviewError('avatar')}
                  />
                  <AvatarFallback className="bg-slate-800 text-slate-400">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarChange}
                  />
                </Label>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Type-specific fields */}
            {userType === 'fan' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-orange-400 font-semibold">
                  <Heart className="w-5 h-5" />
                  Fan Profile
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={fanLocation}
                      onChange={(e) => setFanLocation(e.target.value)}
                      placeholder="City, State/Country"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fav-classes" className="text-slate-300">Favorite Classes</Label>
                    <Input
                      id="fav-classes"
                      value={fanFavClasses}
                      onChange={(e) => setFanFavClasses(e.target.value)}
                      placeholder="e.g. Late Model, Sprint, Modified"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fav-tracks" className="text-slate-300">Favorite Tracks</Label>
                    <Input
                      id="fav-tracks"
                      value={fanFavTracks}
                      onChange={(e) => setFanFavTracks(e.target.value)}
                      placeholder="e.g. Eldora, Knoxville, Bristol"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="why-racing" className="text-slate-300">Why I Love Racing</Label>
                    <Textarea
                      id="why-racing"
                      value={fanWhy}
                      onChange={(e) => setFanWhy(e.target.value)}
                      placeholder="Share your racing story..."
                      className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {userType === 'racer' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-orange-400 font-semibold">
                    <Trophy className="w-5 h-5" />
                    Racer Profile
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="username" className="text-slate-300">Username</Label>
                      <Input
                        id="username"
                        value={racerUsername}
                        onChange={(e) => setRacerUsername(e.target.value)}
                        placeholder="racer123"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team" className="text-slate-300">Team Name</Label>
                      <Input
                        id="team"
                        value={racerTeam}
                        onChange={(e) => setRacerTeam(e.target.value)}
                        placeholder="Team Lightning"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hometown" className="text-slate-300">Hometown</Label>
                      <Input
                        id="hometown"
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        placeholder="City, Country"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 w-full sm:w-48 md:w-52"
                      />
                    </div>
                    <div>
                      <Label htmlFor="car-number" className="text-slate-300">Car Number</Label>
                      <Input
                        id="car-number"
                        value={racerCarNum}
                        onChange={(e) => setRacerCarNum(e.target.value)}
                        placeholder="#24"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 w-full sm:w-28 md:w-32"
                      />
                    </div>
                    <div>
                      <Label htmlFor="racing-class" className="text-slate-300">Racing Class</Label>
                      <Input
                        id="racing-class"
                        value={racerClass}
                        onChange={(e) => setRacerClass(e.target.value)}
                        placeholder="Late Model"
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="bg-slate-800/80 border border-slate-600/50 text-white min-h-[100px] rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Branding */}
                <div>
                  <div className="flex items-center gap-2 text-orange-400 font-semibold">
                    <Camera className="w-5 h-5" />
                    Visual Branding
                  </div>
                  <div className="mt-4">
                    <div>
                      <Label className="text-slate-300 block mb-2">Car Photos</Label>
                      <div className="flex flex-wrap gap-3">
                        {carPhotoPreviews.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Car ${idx+1}`} className="h-20 w-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setCarPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                                // If this was a file upload (not a URL), also remove from files array
                                if (!url.startsWith('http')) {
                                  setCarPhotoFiles(prev => prev.filter((_, i) => i !== idx));
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <Label htmlFor="car-photos-upload" className="h-20 w-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                          <div className="text-center">
                            <Camera className="h-6 w-6 mx-auto text-slate-500" />
                            <span className="text-xs text-slate-500 mt-1">Add</span>
                          </div>
                          <input
                            id="car-photos-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setCarPhotoFiles(prev => [...prev, ...files]);
                                const urls = files.map(f => URL.createObjectURL(f));
                                setCarPhotoPreviews(prev => [...prev, ...urls]);
                              }
                            }}
                          />
                        </Label>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Upload multiple photos showcasing your car.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-orange-400 font-semibold">
                    <Trophy className="w-5 h-5" />
                    Career & Stats
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="career-wins" className="text-slate-300">Career Wins</Label>
                      <select
                        id="career-wins"
                        value={careerWins}
                        onChange={(e) => setCareerWins(parseInt(e.target.value) || 0)}
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 h-10 text-sm w-full sm:w-28 md:w-32"
                      >
                        {[...Array(11)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="podiums" className="text-slate-300">Podiums</Label>
                      <select
                        id="podiums"
                        value={podiums}
                        onChange={(e) => setPodiums(parseInt(e.target.value) || 0)}
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 h-10 text-sm w-full sm:w-28 md:w-32"
                      >
                        {[...Array(11)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="championships" className="text-slate-300">Championships</Label>
                      <select
                        id="championships"
                        value={championships}
                        onChange={(e) => setChampionships(parseInt(e.target.value) || 0)}
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 h-10 text-sm w-full sm:w-28 md:w-32"
                      >
                        {[...Array(11)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="years-racing" className="text-slate-300">Years Racing</Label>
                      <select
                        id="years-racing"
                        value={yearsRacing}
                        onChange={(e) => setYearsRacing(parseInt(e.target.value) || 0)}
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 h-10 text-sm w-full sm:w-28 md:w-32"
                      >
                        {[...Array(11)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="career-history" className="text-slate-300">Career History</Label>
                      <Textarea
                        id="career-history"
                        value={careerHistory}
                        onChange={(e) => setCareerHistory(e.target.value)}
                        placeholder="Describe your racing career history..."
                        className="bg-slate-800/80 border border-slate-600/50 text-white min-h-[100px] rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="highlights" className="text-slate-300">Highlights</Label>
                      <Textarea
                        id="highlights"
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        placeholder="List your career highlights..."
                        className="bg-slate-800/80 border border-slate-600/50 text-white min-h-[100px] rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-slate-300">Achievements</Label>
                      <div className="mt-2 flex flex-col gap-3">
                        <div className="flex gap-2 items-center">
                          <Input
                            id="achievement-new"
                            value={newAchievement}
                            onChange={(e) => setNewAchievement(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = newAchievement.trim();
                                if (v) {
                                  setAchievementsList(prev => [...prev, v]);
                                  setNewAchievement('');
                                }
                              }
                            }}
                            placeholder="Add an achievement (press Enter or click Add)"
                            className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-slate-600/50 text-slate-300 hover:bg-slate-800/60 rounded-xl shadow-md backdrop-blur-sm transition-all duration-200 hover:border-orange-400/40"
                            onClick={() => {
                              const v = newAchievement.trim();
                              if (v) {
                                setAchievementsList(prev => [...prev, v]);
                                setNewAchievement('');
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {achievementsList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const next = [...achievementsList];
                                  next[idx] = e.target.value;
                                  setAchievementsList(next);
                                }}
                                className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => setAchievementsList(prev => prev.filter((_, i) => i !== idx))}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          {achievementsList.length === 0 && (
                            <p className="text-xs text-slate-500">No achievements yet. Add your first one above.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-orange-400 font-semibold">
                    <span className="w-5 h-5 inline-flex items-center justify-center">$</span>
                    Monetization & Fan Support
                  </div>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-900/40">
                      <div>
                        <Label className="text-slate-300">Enable Monetization</Label>
                        <p className="text-sm text-slate-400">Allow fans to support you with tiers and tips</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={monetizationEnabled}
                        onChange={(e) => setMonetizationEnabled(e.target.checked)}
                        className="h-5 w-5 accent-orange-500"
                      />
                    </div>

                    {monetizationEnabled && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Support Tiers</Label>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-slate-600/50 text-slate-300 hover:bg-slate-800/60 rounded-xl shadow-md backdrop-blur-sm transition-all duration-200 hover:border-orange-400/40"
                            onClick={() => setSupportTiers(prev => ([...prev, { name: '', price: 0, description: '' }]))}
                          >
                            Add Tier
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {supportTiers.map((tier, idx) => (
                            <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-400 text-sm">Tier Name</Label>
                                  <Input
                                    value={tier.name}
                                    onChange={(e) => {
                                      const next = [...supportTiers];
                                      next[idx] = { ...next[idx], name: e.target.value };
                                      setSupportTiers(next);
                                    }}
                                    className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-sm">Monthly Price (USD)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={tier.price}
                                    onChange={(e) => {
                                      const next = [...supportTiers];
                                      next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                                      setSupportTiers(next);
                                    }}
                                    className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="text-slate-400 text-sm">Description</Label>
                                  <Textarea
                                    value={tier.description}
                                    onChange={(e) => {
                                      const next = [...supportTiers];
                                      next[idx] = { ...next[idx], description: e.target.value };
                                      setSupportTiers(next);
                                    }}
                                    placeholder="What fans get at this tier..."
                                    className="bg-slate-800/80 border border-slate-600/50 text-white min-h-[80px] rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => setSupportTiers(prev => prev.filter((_, i) => i !== idx))}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <Label htmlFor="thank-you" className="text-slate-300">Thank You Message</Label>
                          <Textarea
                            id="thank-you"
                            value={thankYouMessage}
                            onChange={(e) => setThankYouMessage(e.target.value)}
                            placeholder="Shown after a fan donates or subscribes"
                            className="bg-slate-800/80 border border-slate-600/50 text-white min-h-[80px] rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <div className="flex items-center gap-2 text-orange-400 font-semibold">
                    <User className="w-5 h-5" />
                    Social Links
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-slate-300" htmlFor="instagram">Instagram</Label>
                      <Input 
                        id="instagram" 
                        value={instagramUrl} 
                        onChange={(e) => setInstagramUrl(e.target.value)} 
                        placeholder="https://instagram.com/username" 
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200" 
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300" htmlFor="facebook">Facebook</Label>
                      <Input 
                        id="facebook" 
                        value={facebookUrl} 
                        onChange={(e) => setFacebookUrl(e.target.value)} 
                        placeholder="https://facebook.com/username" 
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200" 
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300" htmlFor="tiktok">TikTok</Label>
                      <Input 
                        id="tiktok" 
                        value={tiktokUrl} 
                        onChange={(e) => setTiktokUrl(e.target.value)} 
                        placeholder="https://tiktok.com/@username" 
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200" 
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300" htmlFor="youtube">YouTube</Label>
                      <Input 
                        id="youtube" 
                        value={youtubeUrl} 
                        onChange={(e) => setYoutubeUrl(e.target.value)} 
                        placeholder="https://youtube.com/@channel" 
                        className="bg-slate-800/80 border border-slate-600/50 text-white rounded-xl shadow-lg backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={saving}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-800/60 rounded-xl shadow-md backdrop-blur-sm transition-all duration-200 hover:border-orange-400/40"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Images are stored securely. Please avoid uploading sensitive content.
        </p>
      </div>
    </div>
  );
};

export default SettingsProfile;