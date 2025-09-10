-- Create fan_stats table
CREATE TABLE IF NOT EXISTS public.fan_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    support_points INTEGER NOT NULL DEFAULT 0,
    total_tips INTEGER NOT NULL DEFAULT 0,
    active_subscriptions INTEGER NOT NULL DEFAULT 0,
    activity_streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (fan_id)
);

-- Create fan_favorite_racers table
CREATE TABLE IF NOT EXISTS public.fan_favorite_racers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    racer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_tipped TIMESTAMP WITH TIME ZONE,
    total_tipped INTEGER NOT NULL DEFAULT 0,
    subscription_tier VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (fan_id, racer_id)
);

-- Create fan_activity table
CREATE TABLE IF NOT EXISTS public.fan_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    racer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount INTEGER,
    badge_id UUID,
    badge_name VARCHAR(100),
    badge_image_url TEXT,
    post_id UUID,
    post_content TEXT,
    comment_id UUID,
    comment_content TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fan_stats_fan_id ON public.fan_stats(fan_id);
CREATE INDEX IF NOT EXISTS idx_fan_favorite_racers_fan_id ON public.fan_favorite_racers(fan_id);
CREATE INDEX IF NOT EXISTS idx_fan_favorite_racers_racer_id ON public.fan_favorite_racers(racer_id);
CREATE INDEX IF NOT EXISTS idx_fan_activity_fan_id ON public.fan_activity(fan_id);
CREATE INDEX IF NOT EXISTS idx_fan_activity_created_at ON public.fan_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_fan_activity_activity_type ON public.fan_activity(activity_type);

-- Add RLS policies
ALTER TABLE public.fan_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_favorite_racers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_activity ENABLE ROW LEVEL SECURITY;

-- Fan stats policies
CREATE POLICY "Users can view any fan stats" 
ON public.fan_stats FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own fan stats" 
ON public.fan_stats FOR UPDATE 
TO authenticated 
USING (auth.uid() = fan_id);

CREATE POLICY "Users can insert their own fan stats" 
ON public.fan_stats FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = fan_id);

-- Fan favorite racers policies
CREATE POLICY "Users can view any fan favorite racers" 
ON public.fan_favorite_racers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own favorite racers" 
ON public.fan_favorite_racers FOR UPDATE 
TO authenticated 
USING (auth.uid() = fan_id);

CREATE POLICY "Users can insert their own favorite racers" 
ON public.fan_favorite_racers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = fan_id);

-- Fan activity policies
CREATE POLICY "Users can view any fan activity" 
ON public.fan_activity FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own activity" 
ON public.fan_activity FOR UPDATE 
TO authenticated 
USING (auth.uid() = fan_id);

CREATE POLICY "Users can insert their own activity" 
ON public.fan_activity FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = fan_id);
