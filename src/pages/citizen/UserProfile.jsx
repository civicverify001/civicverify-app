-- ============================================================
-- PROFILE UPGRADE MIGRATION
-- Civic Score, Achievements, Invitations, Activity Tracking
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON user_achievements FOR SELECT USING (true);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT WITH CHECK (true);

-- 2. User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations"
  ON user_invitations FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = accepted_by);

CREATE POLICY "Users can create invitations"
  ON user_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- 3. Activity log for heatmap (tracks daily activity)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_count INTEGER DEFAULT 1,
  activity_types TEXT[] DEFAULT '{}',
  UNIQUE(user_id, activity_date)
);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity"
  ON user_activity_log FOR SELECT USING (true);

CREATE POLICY "System can manage activity"
  ON user_activity_log FOR ALL USING (true);

-- 4. Add pinned_post_id to users table
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS pinned_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 5. Add invited_by to users table
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 6. Add civic_score to users table (cached)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS civic_score INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 7. Add current_streak and longest_streak
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 8. Function to calculate civic score for a user
CREATE OR REPLACE FUNCTION calculate_civic_score(uid UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  post_count INTEGER;
  comment_count INTEGER;
  survey_count INTEGER;
  debate_count INTEGER;
  follower_count_val INTEGER;
  verified BOOLEAN;
BEGIN
  -- Posts: 3 pts each
  SELECT COUNT(*) INTO post_count FROM community_posts WHERE user_id = uid;
  score := score + (post_count * 3);

  -- Comments: 1 pt each
  SELECT COUNT(*) INTO comment_count FROM community_post_comments WHERE user_id = uid;
  score := score + comment_count;

  -- Surveys completed: 5 pts each
  SELECT COUNT(*) INTO survey_count FROM responses WHERE user_id = uid;
  score := score + (survey_count * 5);

  -- Debates: 8 pts each
  SELECT COUNT(*) INTO debate_count FROM debates
    WHERE creator_id = uid OR opponent_id = uid;
  score := score + (debate_count * 8);

  -- Followers: 2 pts each
  SELECT COUNT(*) INTO follower_count_val FROM user_follows WHERE following_id = uid;
  score := score + (follower_count_val * 2);

  -- ID Verified bonus: 25 pts
  SELECT identity_verified INTO verified FROM users WHERE id = uid;
  IF verified THEN score := score + 25; END IF;

  -- Update cached score
  UPDATE users SET civic_score = score WHERE id = uid;

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to log activity and update streaks
CREATE OR REPLACE FUNCTION log_user_activity(uid UUID, activity_type TEXT)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
  last_date DATE;
  cur_streak INTEGER;
BEGIN
  -- Upsert activity log
  INSERT INTO user_activity_log (user_id, activity_date, activity_count, activity_types)
  VALUES (uid, today, 1, ARRAY[activity_type])
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    activity_count = user_activity_log.activity_count + 1,
    activity_types = CASE
      WHEN activity_type = ANY(user_activity_log.activity_types) THEN user_activity_log.activity_types
      ELSE array_append(user_activity_log.activity_types, activity_type)
    END;

  -- Update streak
  SELECT last_active_date, current_streak INTO last_date, cur_streak FROM users WHERE id = uid;

  IF last_date IS NULL OR last_date < today - 1 THEN
    -- Streak broken or first activity
    UPDATE users SET current_streak = 1, last_active_date = today,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), 1) WHERE id = uid;
  ELSIF last_date = today - 1 THEN
    -- Consecutive day
    UPDATE users SET current_streak = COALESCE(current_streak, 0) + 1, last_active_date = today,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(current_streak, 0) + 1) WHERE id = uid;
  END IF;
  -- If last_date = today, do nothing (already counted today)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to get activity heatmap data (last 90 days)
CREATE OR REPLACE FUNCTION get_user_heatmap(uid UUID)
RETURNS TABLE(activity_date DATE, activity_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT a.activity_date, a.activity_count
  FROM user_activity_log a
  WHERE a.user_id = uid
    AND a.activity_date >= CURRENT_DATE - INTERVAL '90 days'
  ORDER BY a.activity_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to get user's debate record
CREATE OR REPLACE FUNCTION get_debate_record(uid UUID)
RETURNS JSON AS $$
DECLARE
  total_count INTEGER;
  as_creator INTEGER;
  as_opponent INTEGER;
  completed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM debates
    WHERE creator_id = uid OR opponent_id = uid;

  SELECT COUNT(*) INTO as_creator FROM debates WHERE creator_id = uid;
  SELECT COUNT(*) INTO as_opponent FROM debates WHERE opponent_id = uid;

  SELECT COUNT(*) INTO completed_count FROM debates
    WHERE (creator_id = uid OR opponent_id = uid) AND status = 'completed';

  RETURN json_build_object(
    'total', total_count,
    'as_creator', as_creator,
    'as_opponent', as_opponent,
    'completed', completed_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to suggest similar citizens
CREATE OR REPLACE FUNCTION get_similar_citizens(uid UUID, lim INTEGER DEFAULT 5)
RETURNS TABLE(id UUID, full_name TEXT, identity_verified BOOLEAN, avatar_url TEXT, civic_score INTEGER, city TEXT, state TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.identity_verified, u.avatar_url, COALESCE(u.civic_score, 0), u.city, u.state
  FROM users u
  WHERE u.id != uid
    AND u.role = 'citizen'
    AND u.is_banned IS NOT TRUE
    AND u.id NOT IN (SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = uid)
  ORDER BY
    -- Prefer same city/state
    CASE WHEN u.state = (SELECT us.state FROM users us WHERE us.id = uid) THEN 0 ELSE 1 END,
    CASE WHEN u.city = (SELECT us.city FROM users us WHERE us.id = uid) THEN 0 ELSE 1 END,
    -- Then by civic score
    COALESCE(u.civic_score, 0) DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Check and grant achievements function
CREATE OR REPLACE FUNCTION check_achievements(uid UUID)
RETURNS TEXT[] AS $$
DECLARE
  new_achievements TEXT[] := '{}';
  post_count INTEGER;
  comment_count INTEGER;
  survey_count INTEGER;
  debate_count INTEGER;
  follower_count_val INTEGER;
  following_count_val INTEGER;
  invite_count INTEGER;
  score INTEGER;
  streak INTEGER;
  verified BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO post_count FROM community_posts WHERE user_id = uid;
  SELECT COUNT(*) INTO comment_count FROM community_post_comments WHERE user_id = uid;
  SELECT COUNT(*) INTO survey_count FROM responses WHERE user_id = uid;
  SELECT COUNT(*) INTO debate_count FROM debates WHERE creator_id = uid OR opponent_id = uid;
  SELECT COUNT(*) INTO follower_count_val FROM user_follows WHERE following_id = uid;
  SELECT COUNT(*) INTO following_count_val FROM user_follows WHERE follower_id = uid;
  SELECT COUNT(*) INTO invite_count FROM user_invitations WHERE inviter_id = uid AND status = 'accepted';
  SELECT identity_verified, COALESCE(current_streak, 0), COALESCE(civic_score, 0)
    INTO verified, streak, score FROM users WHERE id = uid;

  -- Check each achievement
  IF verified THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'verified_citizen') ON CONFLICT DO NOTHING;
    IF FOUND THEN new_achievements := array_append(new_achievements, 'verified_citizen'); END IF;
  END IF;

  IF post_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'first_post') ON CONFLICT DO NOTHING;
  END IF;
  IF post_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'prolific_poster') ON CONFLICT DO NOTHING;
  END IF;
  IF post_count >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'civic_voice') ON CONFLICT DO NOTHING;
  END IF;

  IF survey_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'first_survey') ON CONFLICT DO NOTHING;
  END IF;
  IF survey_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'survey_veteran') ON CONFLICT DO NOTHING;
  END IF;
  IF survey_count >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'survey_champion') ON CONFLICT DO NOTHING;
  END IF;

  IF debate_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'first_debate') ON CONFLICT DO NOTHING;
  END IF;
  IF debate_count >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'debate_veteran') ON CONFLICT DO NOTHING;
  END IF;

  IF follower_count_val >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'rising_star') ON CONFLICT DO NOTHING;
  END IF;
  IF follower_count_val >= 25 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'influencer') ON CONFLICT DO NOTHING;
  END IF;

  IF streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'week_streak') ON CONFLICT DO NOTHING;
  END IF;
  IF streak >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'month_streak') ON CONFLICT DO NOTHING;
  END IF;

  IF comment_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'commenter') ON CONFLICT DO NOTHING;
  END IF;

  IF following_count_val >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'connector') ON CONFLICT DO NOTHING;
  END IF;

  IF invite_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'recruiter') ON CONFLICT DO NOTHING;
  END IF;
  IF invite_count >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'ambassador') ON CONFLICT DO NOTHING;
  END IF;

  IF score >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'civic_100') ON CONFLICT DO NOTHING;
  END IF;
  IF score >= 500 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (uid, 'civic_500') ON CONFLICT DO NOTHING;
  END IF;

  RETURN new_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Now run calculate_civic_score for existing users:
-- SELECT calculate_civic_score(id) FROM users WHERE role = 'citizen';
-- SELECT check_achievements(id) FROM users WHERE role = 'citizen';
