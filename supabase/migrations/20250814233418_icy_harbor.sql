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
      - `final_viewer_count` (integer, optional)
      - `total_likes` (integer)
      - `duration_seconds` (integer, optional)
      - `stream_url` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `live_streams` table
    - Add policy for streamers to manage their own streams
    - Add policy for anyone to read active live streams
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
  final_viewer_count integer,
  total_likes integer DEFAULT 0,
  duration_seconds integer,
  stream_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streamers can manage own streams"
  ON live_streams
  FOR ALL
  TO authenticated
  USING (auth.uid() = streamer_id)
  WITH CHECK (auth.uid() = streamer_id);

CREATE POLICY "Anyone can read active live streams"
  ON live_streams
  FOR SELECT
  TO authenticated
  USING (is_live = true);

CREATE POLICY "Anyone can read ended streams"
  ON live_streams
  FOR SELECT
  TO authenticated
  USING (is_live = false);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_active ON live_streams (is_live, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer ON live_streams (streamer_id, started_at DESC);