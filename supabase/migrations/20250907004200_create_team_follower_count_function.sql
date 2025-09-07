-- Create a function to get the accurate follower count for a team
CREATE OR REPLACE FUNCTION public.get_team_follower_count(team_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count active followers
  SELECT COUNT(*) INTO v_count
  FROM team_followers
  WHERE team_id = team_uuid
  AND is_active = true;
  
  RETURN v_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_follower_count(uuid) TO authenticated;
