/*
  # Create users and profiles tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `user_type` (text) - 'racer', 'fan', 'track'
      - `name` (text)
      - `email` (text)
      - `profile_complete` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `racer_profiles`
      - `id` (uuid, primary key, references profiles)
      - `username` (text, unique)
      - `bio` (text)
      - `car_number` (text)
      - `racing_class` (text)
      - `hometown` (text)
      - `team_name` (text)
      - `profile_photo_url` (text)
      - `banner_photo_url` (text)
      - `main_sponsor_photo_url` (text)
      - `car_photos` (jsonb)
      - `monetization_enabled` (boolean)
      - `support_tiers` (jsonb)
      - `thank_you_message` (text)
      - `social_links` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `fan_profiles`
      - `id` (uuid, primary key, references profiles)
      - `location` (text)
      - `favorite_classes` (text[])
      - `favorite_tracks` (text[])
      - `followed_racers` (text[])
      - `why_i_love_racing` (text)
      - `profile_photo_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `track_profiles`
      - `id` (uuid, primary key, references profiles)
      - `track_name` (text)
      - `contact_person` (text)
      - `track_type` (text)
      - `location` (text)
      - `contact_email` (text)
      - `website` (text)
      - `classes_hosted` (text[])
      - `track_logo_url` (text)
      - `banner_photo_url` (text)
      - `featured_racers` (text[])
      - `sponsors` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `race_schedules`
      - `id` (uuid, primary key)
      - `racer_id` (uuid, references racer_profiles)
      - `track_id` (uuid, references track_profiles, nullable)
      - `event_name` (text)
      - `track_name` (text)
      - `event_date` (date)
      - `event_time` (time)
      - `location` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create main profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL CHECK (user_type IN ('racer', 'fan', 'track')),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  profile_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create racer profiles table
CREATE TABLE IF NOT EXISTS racer_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  username text UNIQUE,
  bio text,
  car_number text,
  racing_class text,
  hometown text,
  team_name text,
  profile_photo_url text,
  banner_photo_url text,
  main_sponsor_photo_url text,
  car_photos jsonb DEFAULT '[]'::jsonb,
  monetization_enabled boolean DEFAULT false,
  support_tiers jsonb DEFAULT '[
    {"name": "Fan", "price": 9, "description": "Basic support"},
    {"name": "Supporter", "price": 19, "description": "Enhanced access"},
    {"name": "VIP", "price": 49, "description": "Premium experience"}
  ]'::jsonb,
  thank_you_message text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fan profiles table
CREATE TABLE IF NOT EXISTS fan_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  location text,
  favorite_classes text[] DEFAULT '{}',
  favorite_tracks text[] DEFAULT '{}',
  followed_racers text[] DEFAULT '{}',
  why_i_love_racing text,
  profile_photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create track profiles table
CREATE TABLE IF NOT EXISTS track_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  track_name text,
  contact_person text,
  track_type text,
  location text,
  contact_email text,
  website text,
  classes_hosted text[] DEFAULT '{}',
  track_logo_url text,
  banner_photo_url text,
  featured_racers text[] DEFAULT '{}',
  sponsors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create race schedules table
CREATE TABLE IF NOT EXISTS race_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE,
  track_id uuid REFERENCES track_profiles(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  track_name text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE racer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

-- Create policies for racer profiles
CREATE POLICY "Anyone can read racer profiles"
  ON racer_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Racers can manage own profile"
  ON racer_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for fan profiles
CREATE POLICY "Users can read own fan profile"
  ON fan_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Fans can manage own profile"
  ON fan_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for track profiles
CREATE POLICY "Anyone can read track profiles"
  ON track_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tracks can manage own profile"
  ON track_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for race schedules
CREATE POLICY "Anyone can read race schedules"
  ON race_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Racers can manage own schedules"
  ON race_schedules
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = racer_id::text);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_racer_profiles_updated_at
  BEFORE UPDATE ON racer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fan_profiles_updated_at
  BEFORE UPDATE ON fan_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_track_profiles_updated_at
  BEFORE UPDATE ON track_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();