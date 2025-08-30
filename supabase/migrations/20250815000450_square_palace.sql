/*
  # Create live streams table

  1. New Tables
    - `live_streams`
      - `id` (uuid, primary key)
      - `streamer_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text, optional)
      - `is_live` (boolean)
      - `viewer_count` (integer)
      - `started_at` (timestamp)
      - `ended_at` (timestamp, optional)
      - `stream_key` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `live_streams` table
    - Add policies for streamers to manage their own streams
    - Add policies for viewers to read live streams
*/

CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_live boolean DEFAULT false,
  viewer_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  stream_key text,
  final_viewer_count integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Streamers can manage their own streams
CREATE POLICY "Streamers can manage own streams"
  ON live_streams
  FOR ALL
  TO authenticated
  USING (auth.uid() = streamer_id)
  WITH CHECK (auth.uid() = streamer_id);

-- Anyone can read live streams
CREATE POLICY "Anyone can read live streams"
  ON live_streams
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer ON live_streams(streamer_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_live_streams_updated_at();