-- First drop the existing function
DROP FUNCTION IF EXISTS public.toggle_team_follow(uuid, uuid);

-- Create the toggle_team_follow function to properly handle the unique constraint
CREATE OR REPLACE FUNCTION public.toggle_team_follow(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_is_active boolean;
BEGIN
  -- Check if the follow relationship exists
  SELECT EXISTS (
    SELECT 1 FROM team_followers 
    WHERE user_id = p_user_id AND team_id = p_team_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Get current active status
    SELECT is_active INTO v_is_active 
    FROM team_followers 
    WHERE user_id = p_user_id AND team_id = p_team_id;
    
    -- Toggle the is_active flag instead of deleting/reinserting
    UPDATE team_followers
    SET is_active = NOT v_is_active,
        followed_at = CASE WHEN NOT v_is_active THEN now() ELSE followed_at END
    WHERE user_id = p_user_id AND team_id = p_team_id;
    
    -- Update follower count
    IF NOT v_is_active THEN
      -- Increment follower count
      UPDATE teams SET follower_count = follower_count + 1 WHERE id = p_team_id;
    ELSE
      -- Decrement follower count, ensuring it doesn't go below 0
      UPDATE teams SET follower_count = GREATEST(0, follower_count - 1) WHERE id = p_team_id;
    END IF;
    
    RETURN NOT v_is_active;
  ELSE
    -- Insert new follow relationship
    BEGIN
      INSERT INTO team_followers (user_id, team_id, is_active, followed_at)
      VALUES (p_user_id, p_team_id, true, now());
      
      -- Increment follower count
      UPDATE teams SET follower_count = follower_count + 1 WHERE id = p_team_id;
      
      RETURN true;
    EXCEPTION WHEN unique_violation THEN
      -- If we hit a unique violation, update the existing record instead
      UPDATE team_followers
      SET is_active = true,
          followed_at = now()
      WHERE user_id = p_user_id AND team_id = p_team_id;
      
      -- Increment follower count
      UPDATE teams SET follower_count = follower_count + 1 WHERE id = p_team_id;
      
      RETURN true;
    END;
  END IF;
END;
$$;
