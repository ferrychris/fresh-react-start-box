-- Create the get_fan_stats RPC function
CREATE OR REPLACE FUNCTION public.get_fan_stats(fan_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Initialize the result object with default values
  result := jsonb_build_object(
    'fan_id', fan_id,
    'total_tips', 0,
    'active_subscriptions', 0,
    'support_points', 0,
    'activity_streak', 0,
    'created_at', now(),
    'updated_at', now()
  );
  
  -- Count active subscriptions
  SELECT jsonb_set(
    result, 
    '{active_subscriptions}', 
    to_jsonb(COALESCE(count(*), 0))
  ) INTO result
  FROM fan_connections
  WHERE fan_id = $1 AND is_subscribed = true;
  
  -- Sum total tips
  SELECT jsonb_set(
    result, 
    '{total_tips}', 
    to_jsonb(COALESCE(sum(total_tips), 0))
  ) INTO result
  FROM fan_connections
  WHERE fan_id = $1;
  
  -- Calculate support points (arbitrary formula: tips + subscriptions*10)
  SELECT jsonb_set(
    result, 
    '{support_points}', 
    to_jsonb(
      COALESCE((result->>'total_tips')::numeric, 0) + 
      COALESCE((result->>'active_subscriptions')::numeric, 0) * 10
    )
  ) INTO result;
  
  -- Get activity streak from fan_streaks if it exists
  BEGIN
    SELECT jsonb_set(
      result, 
      '{activity_streak}', 
      to_jsonb(COALESCE(current_streak, 0))
    ) INTO result
    FROM fan_streaks
    WHERE user_id = $1;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, keep default value
    NULL;
  END;
  
  RETURN result;
END;
$$;
