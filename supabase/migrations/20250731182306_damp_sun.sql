/*
  # Track Donations System

  1. New Tables
    - `track_donations`
      - `id` (uuid, primary key)
      - `track_id` (uuid, foreign key to track_profiles)
      - `donor_id` (uuid, foreign key to profiles, nullable for anonymous)
      - `amount_cents` (integer)
      - `donation_purpose` (text)
      - `donor_message` (text, nullable)
      - `is_anonymous` (boolean)
      - `stripe_payment_intent_id` (text, unique)
      - `status` (text, check constraint)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `track_donations` table
    - Add policies for tracks to read their donations
    - Add policies for donors to read their own donations
    - Add policy for public to read anonymous donation totals

  3. Indexes
    - Index on track_id for efficient queries
    - Index on donor_id for user donation history
    - Index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS track_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES track_profiles(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  donation_purpose text NOT NULL DEFAULT 'general',
  donor_message text,
  is_anonymous boolean DEFAULT false,
  stripe_payment_intent_id text UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_donations_track_id ON track_donations(track_id);
CREATE INDEX IF NOT EXISTS idx_track_donations_donor_id ON track_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_track_donations_created_at ON track_donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_donations_status ON track_donations(status);

-- Enable RLS
ALTER TABLE track_donations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tracks can read their donations"
  ON track_donations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM track_profiles 
      WHERE track_profiles.id = track_donations.track_id 
      AND track_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Donors can read their own donations"
  ON track_donations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = donor_id);

CREATE POLICY "Anyone can read anonymous donation totals"
  ON track_donations
  FOR SELECT
  TO authenticated
  USING (is_anonymous = true);

CREATE POLICY "System can insert donations"
  ON track_donations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update donation status"
  ON track_donations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to get track donation stats
CREATE OR REPLACE FUNCTION get_track_donation_stats(track_uuid uuid)
RETURNS TABLE (
  total_donations_cents bigint,
  total_donors bigint,
  recent_donations_count bigint,
  top_donation_cents integer,
  avg_donation_cents numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount_cents), 0)::bigint as total_donations_cents,
    COUNT(DISTINCT donor_id)::bigint as total_donors,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::bigint as recent_donations_count,
    COALESCE(MAX(amount_cents), 0)::integer as top_donation_cents,
    COALESCE(AVG(amount_cents), 0)::numeric as avg_donation_cents
  FROM track_donations 
  WHERE track_id = track_uuid 
  AND status = 'completed';
END;
$$;