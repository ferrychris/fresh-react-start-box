/*
  # Create sponsorship inquiries table

  1. New Tables
    - `sponsorship_inquiries`
      - `id` (uuid, primary key)
      - `spot_id` (uuid, foreign key to sponsorship_spots)
      - `racer_id` (uuid, foreign key to racer_profiles)
      - `sponsor_name` (text)
      - `sponsor_email` (text)
      - `sponsor_budget` (text, optional)
      - `message` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sponsorship_inquiries` table
    - Add policy for racers to read their own inquiries
    - Add policy for system to insert inquiries
*/

CREATE TABLE IF NOT EXISTS sponsorship_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES sponsorship_spots(id) ON DELETE CASCADE,
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  sponsor_email text NOT NULL,
  sponsor_budget text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'negotiating', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sponsorship_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Racers can read their own inquiries"
  ON sponsorship_inquiries
  FOR SELECT
  TO authenticated
  USING (racer_id IN (
    SELECT id FROM racer_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "System can insert inquiries"
  ON sponsorship_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Racers can update their inquiry status"
  ON sponsorship_inquiries
  FOR UPDATE
  TO authenticated
  USING (racer_id IN (
    SELECT id FROM racer_profiles WHERE id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_sponsorship_inquiries_updated_at
  BEFORE UPDATE ON sponsorship_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_sponsorship_inquiries_racer_id ON sponsorship_inquiries(racer_id);
CREATE INDEX idx_sponsorship_inquiries_spot_id ON sponsorship_inquiries(spot_id);
CREATE INDEX idx_sponsorship_inquiries_status ON sponsorship_inquiries(status);
CREATE INDEX idx_sponsorship_inquiries_created_at ON sponsorship_inquiries(created_at DESC);