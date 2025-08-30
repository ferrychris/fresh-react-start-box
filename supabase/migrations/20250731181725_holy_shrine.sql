/*
  # Add contact phone field to track profiles

  1. Schema Changes
    - Add `contact_phone` column to `track_profiles` table
    - Allow NULL values for optional phone numbers
    - Add proper data type for phone storage

  2. Data Migration
    - Existing tracks will have NULL phone numbers
    - New tracks can optionally provide phone numbers

  3. Security
    - No additional RLS changes needed
    - Existing policies cover the new field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'track_profiles' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE track_profiles ADD COLUMN contact_phone text;
  END IF;
END $$;