/*
  # Fan Relationship System

  1. New Tables
    - `fan_connections`
      - `id` (uuid, primary key)
      - `fan_id` (uuid, references profiles)
      - `racer_id` (uuid, references racer_profiles)
      - `became_fan_at` (timestamp)
      - `is_superfan` (boolean)
      - `last_support_date` (timestamp)
      - `total_tips` (numeric)
      - `is_subscribed` (boolean)

  2. Security
    - Enable RLS on `fan_connections` table
    - Add policies for fans to manage their own connections
    - Add policies for racers to read their fan connections
    - Add policies for public read access to fan counts

  3. Functions
    - Function to update superfan status automatically
    - Function to get fan statistics for racers
*/

-- Create fan_connections table
CREATE TABLE IF NOT EXISTS fan_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  racer_id uuid NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,
  became_fan_at timestamptz DEFAULT now(),
  is_superfan boolean DEFAULT false,
  last_support_date timestamptz,
  total_tips numeric DEFAULT 0,
  is_subscribed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fan_id, racer_id)
);

-- Enable RLS
ALTER TABLE fan_connections ENABLE ROW LEVEL SECURITY;

-- Policies for fan_connections
CREATE POLICY "Anyone can read fan connections"
  ON fan_connections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fans can manage own connections"
  ON fan_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Racers can read their fan connections"
  ON fan_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = racer_id);

-- Function to update superfan status
CREATE OR REPLACE FUNCTION update_superfan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_superfan based on tips or subscription
  NEW.is_superfan := (NEW.total_tips > 0 OR NEW.is_subscribed = true);
  NEW.updated_at := now();
  
  -- Update last_support_date if there's financial support
  IF NEW.total_tips > OLD.total_tips OR (NEW.is_subscribed = true AND OLD.is_subscribed = false) THEN
    NEW.last_support_date := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update superfan status
CREATE TRIGGER update_superfan_status_trigger
  BEFORE UPDATE ON fan_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_superfan_status();

-- Function to get fan statistics for a racer
CREATE OR REPLACE FUNCTION get_racer_fan_stats(racer_uuid uuid)
RETURNS TABLE (
  total_fans bigint,
  super_fans bigint,
  top_superfan_id uuid,
  top_superfan_name text,
  top_superfan_total numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH fan_stats AS (
    SELECT 
      COUNT(*) as total_fans,
      COUNT(*) FILTER (WHERE is_superfan = true) as super_fans
    FROM fan_connections 
    WHERE racer_id = racer_uuid
  ),
  top_fan AS (
    SELECT 
      fc.fan_id,
      p.name,
      fc.total_tips
    FROM fan_connections fc
    JOIN profiles p ON fc.fan_id = p.id
    WHERE fc.racer_id = racer_uuid 
      AND fc.is_superfan = true
      AND fc.last_support_date >= (now() - interval '30 days')
    ORDER BY fc.total_tips DESC
    LIMIT 1
  )
  SELECT 
    fs.total_fans,
    fs.super_fans,
    tf.fan_id,
    tf.name,
    tf.total_tips
  FROM fan_stats fs
  LEFT JOIN top_fan tf ON true;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_fan_connections_updated_at
  BEFORE UPDATE ON fan_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();