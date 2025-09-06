-- Add profile completion badges to badge_definitions table
INSERT INTO public.badge_definitions (name, description, icon_emoji, rarity, is_active)
VALUES 
  ('Profile Starter', 'Started filling out your fan profile', '📝', 'common', true),
  ('Profile Pro', 'Completed 50% of your fan profile', '📊', 'rare', true),
  ('Profile Master', 'Completed 100% of your fan profile', '🏆', 'epic', true)
ON CONFLICT (name) DO NOTHING;

-- Create function to check and award profile completion badges
CREATE OR REPLACE FUNCTION public.check_profile_completion_badges()
RETURNS TRIGGER AS $$
DECLARE
  completion_percentage INTEGER;
  total_fields INTEGER := 6; -- location, favorite_classes, favorite_tracks, followed_racers, why_i_love_racing, profile_photo_url
  completed_fields INTEGER := 0;
  starter_badge_id UUID;
  pro_badge_id UUID;
  master_badge_id UUID;
BEGIN
  -- Count completed fields
  IF NEW.location IS NOT NULL AND NEW.location != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.favorite_classes IS NOT NULL AND array_length(NEW.favorite_classes, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.favorite_tracks IS NOT NULL AND array_length(NEW.favorite_tracks, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.followed_racers IS NOT NULL AND array_length(NEW.followed_racers, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.why_i_love_racing IS NOT NULL AND NEW.why_i_love_racing != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.profile_photo_url IS NOT NULL AND NEW.profile_photo_url != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Calculate percentage
  completion_percentage := (completed_fields * 100) / total_fields;
  
  -- Get badge IDs
  SELECT id INTO starter_badge_id FROM public.badge_definitions WHERE name = 'Profile Starter';
  SELECT id INTO pro_badge_id FROM public.badge_definitions WHERE name = 'Profile Pro';
  SELECT id INTO master_badge_id FROM public.badge_definitions WHERE name = 'Profile Master';
  
  -- Award badges based on completion percentage
  IF completed_fields > 0 THEN
    -- Award Profile Starter badge if at least one field is completed
    INSERT INTO public.fan_badges (fan_id, badge_id, earned_at)
    VALUES (NEW.id, starter_badge_id, NOW())
    ON CONFLICT (fan_id, badge_id) DO NOTHING;
    
    -- Award points for first field completion
    PERFORM public.award_points(
      NEW.id, 
      10, 
      'profile_completion', 
      'profile_starter', 
      'Started filling out your fan profile'
    );
  END IF;
  
  IF completion_percentage >= 50 THEN
    -- Award Profile Pro badge if at least 50% complete
    INSERT INTO public.fan_badges (fan_id, badge_id, earned_at)
    VALUES (NEW.id, pro_badge_id, NOW())
    ON CONFLICT (fan_id, badge_id) DO NOTHING;
    
    -- Award points for 50% completion
    PERFORM public.award_points(
      NEW.id, 
      25, 
      'profile_completion', 
      'profile_pro', 
      'Completed 50% of your fan profile'
    );
  END IF;
  
  IF completion_percentage = 100 THEN
    -- Award Profile Master badge if 100% complete
    INSERT INTO public.fan_badges (fan_id, badge_id, earned_at)
    VALUES (NEW.id, master_badge_id, NOW())
    ON CONFLICT (fan_id, badge_id) DO NOTHING;
    
    -- Award points for 100% completion
    PERFORM public.award_points(
      NEW.id, 
      50, 
      'profile_completion', 
      'profile_master', 
      'Completed 100% of your fan profile'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on fan_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'check_profile_completion_badges_trigger'
  ) THEN
    CREATE TRIGGER check_profile_completion_badges_trigger
    AFTER INSERT OR UPDATE ON public.fan_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_profile_completion_badges();
  END IF;
END $$;
