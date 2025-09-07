-- Create fan_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fan_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id),
  location TEXT,
  favorite_classes TEXT[] DEFAULT '{}',
  favorite_tracks TEXT[] DEFAULT '{}',
  followed_racers TEXT[] DEFAULT '{}',
  why_i_love_racing TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.fan_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own fan profile
CREATE POLICY "Users can read their own fan profile"
  ON public.fan_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to create their own fan profile
CREATE POLICY "Users can create their own fan profile"
  ON public.fan_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own fan profile
CREATE POLICY "Users can update their own fan profile"
  ON public.fan_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow public read access to fan profiles for public feeds
CREATE POLICY "Public read access to fan profiles"
  ON public.fan_profiles
  FOR SELECT
  USING (true);
