/*
  # Create series_profiles table

  1. New Tables
    - `series_profiles`
      - `id` (uuid, primary key, references profiles.id)
      - `series_name` (text, required)
      - `description` (text, optional)
      - `series_type` (text, optional, default 'Sprint Car')
      - `headquarters` (text, optional)
      - `founded` (integer, optional)
      - `contact_email` (text, optional)
      - `contact_person` (text, optional)
      - `contact_phone` (text, optional)
      - `website` (text, optional)
      - `series_logo_url` (text, optional)
      - `banner_photo_url` (text, optional)
      - `social_links` (jsonb, default empty object)
      - `featured_racers` (text array, default empty array)
      - `featured_tracks` (text array, default empty array)
      - `total_purse_cents` (integer, default 0)
      - `championship_purse_cents` (integer, default 0)
      - `total_events` (integer, default 0)
      - `profile_published` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `series_profiles` table
    - Add policy for anyone to read published series profiles
    - Add policy for series owners to manage their own profiles

  3. Indexes
    - Add index on profile_published for efficient filtering
    - Add index on series_type for filtering by type
    - Add index on created_at for ordering
*/

CREATE TABLE IF NOT EXISTS series_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  series_name text NOT NULL,
  description text,
  series_type text DEFAULT 'Sprint Car',
  headquarters text,
  founded integer,
  contact_email text,
  contact_person text,
  contact_phone text,
  website text,
  series_logo_url text,
  banner_photo_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  featured_racers text[] DEFAULT '{}',
  featured_tracks text[] DEFAULT '{}',
  total_purse_cents integer DEFAULT 0,
  championship_purse_cents integer DEFAULT 0,
  total_events integer DEFAULT 0,
  profile_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE series_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read published series profiles"
  ON series_profiles
  FOR SELECT
  TO authenticated
  USING (profile_published = true);

CREATE POLICY "Series owners can manage own profiles"
  ON series_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_series_profiles_published 
  ON series_profiles(profile_published) 
  WHERE profile_published = true;

CREATE INDEX IF NOT EXISTS idx_series_profiles_type 
  ON series_profiles(series_type);

CREATE INDEX IF NOT EXISTS idx_series_profiles_created_at 
  ON series_profiles(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_series_profiles_updated_at
  BEFORE UPDATE ON series_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();