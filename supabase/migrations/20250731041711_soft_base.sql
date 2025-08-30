/*
  # Add career statistics to racer profiles

  1. New Columns
    - `career_wins` (integer) - Total career wins
    - `podiums` (integer) - Total podium finishes  
    - `championships` (integer) - Total championships won
    - `years_racing` (integer) - Years of racing experience

  2. Updates
    - Add columns to racer_profiles table
    - Set default values to 0
    - Allow racers to update their own stats
*/

-- Add career statistics columns to racer_profiles table
ALTER TABLE racer_profiles 
ADD COLUMN IF NOT EXISTS career_wins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS podiums integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS championships integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS years_racing integer DEFAULT 0;

-- Add constraints to ensure non-negative values
ALTER TABLE racer_profiles 
ADD CONSTRAINT career_wins_non_negative CHECK (career_wins >= 0),
ADD CONSTRAINT podiums_non_negative CHECK (podiums >= 0),
ADD CONSTRAINT championships_non_negative CHECK (championships >= 0),
ADD CONSTRAINT years_racing_non_negative CHECK (years_racing >= 0);