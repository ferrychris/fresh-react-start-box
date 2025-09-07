-- Update profile_complete to true for users who have followed racers
UPDATE public.profiles
SET profile_complete = true
WHERE id IN (
  SELECT DISTINCT fan_id 
  FROM public.fan_connections
  WHERE fan_id IS NOT NULL
);

-- Create a trigger to automatically mark profiles as complete when they follow a racer
CREATE OR REPLACE FUNCTION public.mark_profile_complete_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET profile_complete = true
  WHERE id = NEW.fan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_mark_profile_complete_on_follow ON public.fan_connections;

-- Create the trigger
CREATE TRIGGER trg_mark_profile_complete_on_follow
AFTER INSERT ON public.fan_connections
FOR EACH ROW
EXECUTE FUNCTION public.mark_profile_complete_on_follow();
