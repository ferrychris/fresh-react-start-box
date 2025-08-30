/*
  # Create track events table

  1. New Tables
    - `track_events`
      - `id` (uuid, primary key)
      - `track_id` (uuid, foreign key to track_profiles)
      - `event_title` (text, required)
      - `event_date` (date, required)
      - `event_time` (time)
      - `entry_fee_cents` (integer)
      - `payout_cents` (integer)
      - `classes` (text array)
      - `custom_classes` (text array)
      - `description` (text)
      - `event_flyer_url` (text)
      - `is_published` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `track_events` table
    - Add policy for tracks to manage their own events
    - Add policy for public read access to published events

  3. Indexes
    - Index on track_id for efficient queries
    - Index on event_date for chronological sorting
    - Index on is_published for filtering
*/

CREATE TABLE IF NOT EXISTS track_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES track_profiles(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  entry_fee_cents integer DEFAULT 0,
  payout_cents integer DEFAULT 0,
  classes text[] DEFAULT '{}',
  custom_classes text[] DEFAULT '{}',
  description text,
  event_flyer_url text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE track_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tracks can manage their own events"
  ON track_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM track_profiles 
      WHERE track_profiles.id = track_events.track_id 
      AND track_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM track_profiles 
      WHERE track_profiles.id = track_events.track_id 
      AND track_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read published events"
  ON track_events
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_track_events_track_id ON track_events(track_id);
CREATE INDEX IF NOT EXISTS idx_track_events_date ON track_events(event_date);
CREATE INDEX IF NOT EXISTS idx_track_events_published ON track_events(is_published) WHERE is_published = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_track_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_track_events_updated_at
  BEFORE UPDATE ON track_events
  FOR EACH ROW
  EXECUTE FUNCTION update_track_events_updated_at();