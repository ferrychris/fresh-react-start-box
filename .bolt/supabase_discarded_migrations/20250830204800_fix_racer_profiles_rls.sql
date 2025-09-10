-- Enable RLS on the racer_profiles table if it's not already enabled
ALTER TABLE public.racer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing select policy to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to racer profiles" ON public.racer_profiles;

-- Create a new policy that allows anyone to read racer profiles
CREATE POLICY "Allow public read access to racer profiles"
ON public.racer_profiles
FOR SELECT
USING (true);
