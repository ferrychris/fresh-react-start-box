-- Fan Reward System Database Schema

-- Points System
CREATE TABLE IF NOT EXISTS fan_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point transactions for tracking how points are earned/spent
CREATE TABLE IF NOT EXISTS fan_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL, -- positive for earned, negative for spent
  transaction_type TEXT NOT NULL, -- 'comment', 'like', 'tip', 'subscription', 'redeem'
  reference_id UUID, -- references the related action (post_id, tip_id, etc.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Day Streak System
CREATE TABLE IF NOT EXISTS fan_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INTEGER NOT NULL DEFAULT 0, -- streak protection uses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge System
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  criteria JSONB NOT NULL, -- requirements to earn the badge
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS fan_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB, -- for tracking progress towards badge
  UNIQUE(fan_id, badge_id)
);

-- Favorites System (enhanced)
CREATE TABLE IF NOT EXISTS fan_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('racer', 'post', 'track', 'series')),
  target_id UUID NOT NULL,
  favorite_level INTEGER DEFAULT 1, -- 1-5 star rating
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fan_id, target_type, target_id)
);

-- Insert initial badge definitions
INSERT INTO badge_definitions (name, description, icon_emoji, rarity, criteria) VALUES
('Welcome Aboard', 'Complete your first day on the platform', '👋', 'common', '{"first_login": true}'),
('First Comment', 'Leave your first comment on a post', '💬', 'common', '{"comments_count": 1}'),
('Like Machine', 'Give 100 likes to posts', '❤️', 'common', '{"likes_given": 100}'),
('Tip Starter', 'Send your first tip to a racer', '💰', 'common', '{"tips_sent": 1}'),
('Loyal Fan', 'Subscribe to your first racer', '⭐', 'rare', '{"subscriptions_count": 1}'),
('Week Warrior', 'Maintain a 7-day activity streak', '🔥', 'rare', '{"streak_days": 7}'),
('Month Master', 'Maintain a 30-day activity streak', '🏆', 'epic', '{"streak_days": 30}'),
('Super Supporter', 'Send $100 total in tips', '🎯', 'epic', '{"total_tips_cents": 10000}'),
('Century Club', 'Maintain a 100-day activity streak', '💎', 'legendary', '{"streak_days": 100}'),
('VIP Patron', 'Subscribe to 5 different racers', '👑', 'legendary', '{"subscriptions_count": 5}');

-- RLS Policies
ALTER TABLE fan_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_favorites ENABLE ROW LEVEL SECURITY;

-- Points policies
CREATE POLICY "Users can view own points" ON fan_points FOR SELECT USING (fan_id = auth.uid());
CREATE POLICY "Users can view own point transactions" ON fan_point_transactions FOR SELECT USING (fan_id = auth.uid());

-- Streak policies
CREATE POLICY "Users can view own streaks" ON fan_streaks FOR SELECT USING (fan_id = auth.uid());

-- Badge policies
CREATE POLICY "Anyone can view badge definitions" ON badge_definitions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Users can view own badges" ON fan_badges FOR SELECT USING (fan_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON fan_favorites FOR ALL USING (fan_id = auth.uid());

-- Helper functions
CREATE OR REPLACE FUNCTION award_points(
  p_fan_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO fan_point_transactions (fan_id, points_change, transaction_type, reference_id, description)
  VALUES (p_fan_id, p_points, p_transaction_type, p_reference_id, p_description);
  
  -- Update fan points
  INSERT INTO fan_points (fan_id, current_points, total_earned)
  VALUES (p_fan_id, p_points, p_points)
  ON CONFLICT (fan_id) DO UPDATE SET
    current_points = fan_points.current_points + p_points,
    total_earned = fan_points.total_earned + p_points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_activity_streak(p_fan_id UUID) RETURNS VOID AS $$
DECLARE
  streak_record fan_streaks%ROWTYPE;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get current streak record
  SELECT * INTO streak_record FROM fan_streaks WHERE fan_id = p_fan_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO fan_streaks (fan_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_fan_id, 1, 1, today_date);
  ELSE
    -- Check if this is consecutive day
    IF streak_record.last_activity_date = today_date THEN
      -- Already counted today, do nothing
      RETURN;
    ELSIF streak_record.last_activity_date = today_date - INTERVAL '1 day' THEN
      -- Consecutive day, increment streak
      UPDATE fan_streaks SET
        current_streak = streak_record.current_streak + 1,
        longest_streak = GREATEST(streak_record.longest_streak, streak_record.current_streak + 1),
        last_activity_date = today_date,
        updated_at = NOW()
      WHERE fan_id = p_fan_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE fan_streaks SET
        current_streak = 1,
        last_activity_date = today_date,
        updated_at = NOW()
      WHERE fan_id = p_fan_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_and_award_badges(p_fan_id UUID) RETURNS VOID AS $$
DECLARE
  badge_def badge_definitions%ROWTYPE;
  fan_stats RECORD;
BEGIN
  -- Get fan statistics
  SELECT 
    COALESCE(SUM(CASE WHEN pt.transaction_type = 'comment' THEN 1 ELSE 0 END), 0) as comments_count,
    COALESCE(SUM(CASE WHEN pt.transaction_type = 'like' THEN 1 ELSE 0 END), 0) as likes_given,
    COALESCE(SUM(CASE WHEN pt.transaction_type = 'tip' THEN 1 ELSE 0 END), 0) as tips_sent,
    COALESCE(SUM(CASE WHEN pt.transaction_type = 'subscription' THEN 1 ELSE 0 END), 0) as subscriptions_count,
    COALESCE((SELECT current_streak FROM fan_streaks WHERE fan_id = p_fan_id), 0) as streak_days,
    COALESCE((SELECT SUM(total_amount_cents) FROM transactions WHERE payer_id = p_fan_id AND transaction_type = 'tip' AND status = 'completed'), 0) as total_tips_cents
  INTO fan_stats
  FROM fan_point_transactions pt
  WHERE pt.fan_id = p_fan_id;

  -- Check each badge definition
  FOR badge_def IN SELECT * FROM badge_definitions WHERE is_active = TRUE LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM fan_badges WHERE fan_id = p_fan_id AND badge_id = badge_def.id) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria (simplified for common badges)
    IF (badge_def.name = 'Welcome Aboard' AND TRUE) OR
       (badge_def.name = 'First Comment' AND fan_stats.comments_count >= 1) OR
       (badge_def.name = 'Like Machine' AND fan_stats.likes_given >= 100) OR
       (badge_def.name = 'Tip Starter' AND fan_stats.tips_sent >= 1) OR
       (badge_def.name = 'Loyal Fan' AND fan_stats.subscriptions_count >= 1) OR
       (badge_def.name = 'Week Warrior' AND fan_stats.streak_days >= 7) OR
       (badge_def.name = 'Month Master' AND fan_stats.streak_days >= 30) OR
       (badge_def.name = 'Super Supporter' AND fan_stats.total_tips_cents >= 10000) OR
       (badge_def.name = 'Century Club' AND fan_stats.streak_days >= 100) OR
       (badge_def.name = 'VIP Patron' AND fan_stats.subscriptions_count >= 5) THEN
      
      -- Award the badge
      INSERT INTO fan_badges (fan_id, badge_id) VALUES (p_fan_id, badge_def.id);
      
      -- Award points for earning badge
      CASE badge_def.rarity
        WHEN 'common' THEN PERFORM award_points(p_fan_id, 10, 'badge', badge_def.id, 'Earned: ' || badge_def.name);
        WHEN 'rare' THEN PERFORM award_points(p_fan_id, 25, 'badge', badge_def.id, 'Earned: ' || badge_def.name);
        WHEN 'epic' THEN PERFORM award_points(p_fan_id, 50, 'badge', badge_def.id, 'Earned: ' || badge_def.name);
        WHEN 'legendary' THEN PERFORM award_points(p_fan_id, 100, 'badge', badge_def.id, 'Earned: ' || badge_def.name);
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;