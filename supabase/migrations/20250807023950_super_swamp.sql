/*
  # Create sponsorship spots table

  1. New Tables
    - `sponsorship_spots`
      - `id` (uuid, primary key)
      - `racer_id` (uuid, foreign key to racer_profiles)
      - `spot_name` (text)
      - `price_per_race` (integer, in cents)
      - `position_top` (text, CSS percentage)
      - `position_left` (text, CSS percentage)
      - `spot_size` (text, enum: small, medium, large)
      - `description` (text, optional)
      - `is_available` (boolean, default true)
      - `sponsor_name` (text, optional)
      - `sponsor_logo_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sponsorship_spots` table
    - Add policy for racers to manage their own spots
    - Add policy for public read access to spots
*/

CREATE TABLE IF NOT EXISTS sponsorship_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,
  spot_name text NOT NULL,
  price_per_race integer NOT NULL DEFAULT 0,
  position_top text NOT NULL DEFAULT '50%',
  position_left text NOT NULL DEFAULT '50%',
  spot_size text NOT NULL DEFAULT 'medium' CHECK (spot_size IN ('small', 'medium', 'large')),
  description text,
  is_available boolean DEFAULT true,
  sponsor_name text,
  sponsor_logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sponsorship_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sponsorship spots"
  ON sponsorship_spots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Racers can manage own sponsorship spots"
  ON sponsorship_spots
  FOR ALL
  TO authenticated
  USING (racer_id IN (
    SELECT id FROM racer_profiles WHERE id = auth.uid()
  ))
  WITH CHECK (racer_id IN (
    SELECT id FROM racer_profiles WHERE id = auth.uid()
  ));

CREATE TRIGGER update_sponsorship_spots_updated_at
  BEFORE UPDATE ON sponsorship_spots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();