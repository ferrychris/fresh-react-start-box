-- Create a function to update both profile_complete and fan_profiles when a user follows a racer
CREATE OR REPLACE FUNCTION public.handle_fan_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark the user's profile as complete
  UPDATE public.profiles
  SET profile_complete = true
  WHERE id = NEW.fan_id;
  
  -- Check if fan_profile exists, if not create it
  INSERT INTO public.fan_profiles (id)
  VALUES (NEW.fan_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- Update the fan_profiles.followed_racers array to include this racer
  UPDATE public.fan_profiles
  SET followed_racers = array_append(
    COALESCE(followed_racers, '{}'::text[]), 
    NEW.racer_id::text
  )
  WHERE id = NEW.fan_id
  AND NOT (NEW.racer_id::text = ANY(COALESCE(followed_racers, '{}'::text[])));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS trg_mark_profile_complete_on_follow ON public.fan_connections;
DROP TRIGGER IF EXISTS trg_handle_fan_connection ON public.fan_connections;

-- Create the new trigger
CREATE TRIGGER trg_handle_fan_connection
AFTER INSERT OR UPDATE ON public.fan_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_fan_connection();

-- Retroactively update all existing connections
DO $$
DECLARE
  connection RECORD;
BEGIN
  FOR connection IN SELECT * FROM public.fan_connections LOOP
    -- Mark profile as complete
    UPDATE public.profiles
    SET profile_complete = true
    WHERE id = connection.fan_id;
    
    -- Ensure fan_profile exists
    INSERT INTO public.fan_profiles (id)
    VALUES (connection.fan_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Update followed_racers array
    UPDATE public.fan_profiles
    SET followed_racers = array_append(
      COALESCE(followed_racers, '{}'::text[]), 
      connection.racer_id::text
    )
    WHERE id = connection.fan_id
    AND NOT (connection.racer_id::text = ANY(COALESCE(followed_racers, '{}'::text[])));
  END LOOP;
END;
$$;
