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
    if (!userId) return;
    try {
      setSaving(true);

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

      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      });

      setAvatarFile(null);
      setBannerFile(null);
      setOriginalAvatarUrl(newAvatarUrl || null);
      setOriginalBannerUrl(newBannerUrl || null);

      // Navigate back after short delay
      setTimeout(() => navigate(-1), 800);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Failed to save profile';
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Edit Profile
          </h1>
        </div>

        {/* Banner Card */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardContent className="p-0">
            <div className="relative h-48 w-full rounded-t-lg overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700">
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
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg border border-slate-600 transition-colors">
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
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Name Section */}
            <div className="flex items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-slate-700">
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-orange-400 font-semibold">
                  <Trophy className="w-5 h-5" />
                  Racer Profile
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-slate-300">Username</Label>
                    <Input
                      id="username"
                      value={racerUsername}
                      onChange={(e) => setRacerUsername(e.target.value)}
                      placeholder="racer123"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="team" className="text-slate-300">Team Name</Label>
                    <Input
                      id="team"
                      value={racerTeam}
                      onChange={(e) => setRacerTeam(e.target.value)}
                      placeholder="Team Lightning"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="car-number" className="text-slate-300">Car Number</Label>
                    <Input
                      id="car-number"
                      value={racerCarNum}
                      onChange={(e) => setRacerCarNum(e.target.value)}
                      placeholder="#24"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="racing-class" className="text-slate-300">Racing Class</Label>
                    <Input
                      id="racing-class"
                      value={racerClass}
                      onChange={(e) => setRacerClass(e.target.value)}
                      placeholder="Late Model"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
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
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
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