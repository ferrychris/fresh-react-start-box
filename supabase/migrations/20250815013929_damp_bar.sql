/*
  # Create Profile Views System

  1. New Tables
    - `profile_views`
      - `profile_id` (uuid, primary key, foreign key to profiles)
      - `view_count` (bigint, default 0)
      - `last_viewed_at` (timestamp)
      - `created_at` (timestamp)

  2. Functions
    - `increment_profile_views` - Increments view count for a profile

  3. Security
    - Enable RLS on `profile_views` table
    - Add policy for public read access to view counts
    - Grant execute permissions on the function
*/

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    view_count bigint DEFAULT 0 NOT NULL,
    last_viewed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to profile_views" 
ON public.profile_views
FOR SELECT 
USING (true);

-- Create function to increment profile views
CREATE OR REPLACE FUNCTION public.increment_profile_views(
    p_profile_id uuid, 
    p_view_type text DEFAULT 'profile', 
    p_viewer_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update profile view count
    INSERT INTO public.profile_views (profile_id, view_count, last_viewed_at)
    VALUES (p_profile_id, 1, now())
    ON CONFLICT (profile_id) DO UPDATE
    SET
        view_count = profile_views.view_count + 1,
        last_viewed_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid, text, uuid) TO anon;