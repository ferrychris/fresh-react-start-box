/*
  # Add Series User Type

  1. Database Changes
    - Add 'series' to the user_type enum constraint
    - Update check constraint to allow 'series' as valid user type

  2. Security
    - Maintains existing RLS policies
    - No changes to existing permissions
*/

-- Add 'series' to the user_type check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['racer'::text, 'fan'::text, 'track'::text, 'series'::text, 'admin'::text]));