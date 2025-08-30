/*
  # Create live streams table with proper foreign key relationships

  1. New Tables
    - `live_streams`
      - `id` (uuid, primary key)
      - `streamer_id` (uuid, foreign key to profiles.id)
      - `title` (text, required)
      - `description` (text, optional)
      - `viewer_count` (integer, default 0)
      - `is_live` (boolean, default true)
      - `started_at` (timestamp, default now)
      - `ended_at` (timestamp, optional)
      - `stream_key` (text, optional)
      - `thumbnail_url` (text, optional)
      - `category` (text, default 'racing')
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `live_streams` table
    - Add policy for streamers to manage their own streams
    - Add policy for anyone to read live streams
    - Add policy for system to update viewer counts

  3. Indexes
    - Index on streamer_id for fast lookups
    - Index on is_live for filtering active streams
    - Index on created_at for ordering

  4. Foreign Keys
    - streamer_id references profiles(id) with CASCADE delete
*/

CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  viewer_count integer DEFAULT 0,
  is_live boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  stream_key text,
  thumbnail_url text,
  category text DEFAULT 'racing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint with the exact name expected by the query
ALTER TABLE live_streams 
ADD CONSTRAINT live_streams_streamer_id_fkey 
FOREIGN KEY (streamer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer_id ON live_streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_viewer_count ON live_streams(viewer_count DESC);

-- Enable Row Level Security
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Policies for live streams
CREATE POLICY "Anyone can read live streams"
  ON live_streams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Streamers can manage own streams"
  ON live_streams
  FOR ALL
  TO authenticated
  USING (auth.uid() = streamer_id)
  WITH CHECK (auth.uid() = streamer_id);

CREATE POLICY "System can update viewer counts"
  ON live_streams
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_live_streams_updated_at();