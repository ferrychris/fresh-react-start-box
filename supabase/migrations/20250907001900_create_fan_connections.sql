-- Create fan_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fan_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES public.profiles(id),
  racer_id UUID NOT NULL REFERENCES public.racer_profiles(id),
  became_fan_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_superfan BOOLEAN DEFAULT false,
  is_subscribed BOOLEAN DEFAULT false,
  total_tips INTEGER DEFAULT 0,
  subscription_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fan_id, racer_id)
);

-- Add RLS policies
ALTER TABLE public.fan_connections ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own fan connections
CREATE POLICY "Users can read their own fan connections"
  ON public.fan_connections
  FOR SELECT
  USING (auth.uid() = fan_id);

-- Allow users to create their own fan connections
CREATE POLICY "Users can create their own fan connections"
  ON public.fan_connections
  FOR INSERT
  WITH CHECK (auth.uid() = fan_id);

-- Allow users to update their own fan connections
CREATE POLICY "Users can update their own fan connections"
  ON public.fan_connections
  FOR UPDATE
  USING (auth.uid() = fan_id);

-- Allow users to delete their own fan connections
CREATE POLICY "Users can delete their own fan connections"
  ON public.fan_connections
  FOR DELETE
  USING (auth.uid() = fan_id);

-- Allow public read access to fan connections for public feeds
CREATE POLICY "Public read access to fan connections"
  ON public.fan_connections
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS fan_connections_fan_id_idx ON public.fan_connections(fan_id);
CREATE INDEX IF NOT EXISTS fan_connections_racer_id_idx ON public.fan_connections(racer_id);
