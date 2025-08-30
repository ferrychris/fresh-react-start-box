-- Create virtual_gifts table
CREATE TABLE public.virtual_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  token_cost INTEGER NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active virtual gifts" 
ON public.virtual_gifts 
FOR SELECT 
USING (is_active = true);

-- Insert some default virtual gifts
INSERT INTO public.virtual_gifts (name, emoji, description, token_cost, rarity) VALUES
('Heart', '❤️', 'Show your love and support', 10, 'common'),
('Star', '⭐', 'You''re a star performer!', 25, 'common'),
('Trophy', '🏆', 'Champion performance!', 50, 'rare'),
('Fire', '🔥', 'That was fire!', 30, 'common'),
('Lightning', '⚡', 'Electric performance!', 75, 'rare'),
('Crown', '👑', 'Racing royalty!', 100, 'epic'),
('Diamond', '💎', 'Precious talent!', 200, 'legendary'),
('Rocket', '🚀', 'To the moon!', 150, 'epic');

-- Update gift_transactions to have is_public column and proper structure
ALTER TABLE public.gift_transactions 
ADD COLUMN IF NOT EXISTS racer_token_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_token_amount INTEGER DEFAULT 0;

-- Update notifications table to have title and message columns
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS message TEXT;

-- Update existing notifications to have title and message if they don't
UPDATE public.notifications 
SET 
  title = COALESCE(title, CASE 
    WHEN type = 'tip' THEN 'New Tip Received!'
    WHEN type = 'gift' THEN 'New Gift Received!'
    WHEN type = 'subscription' THEN 'New Subscriber!'
    ELSE 'Notification'
  END),
  message = COALESCE(message, 'You have a new notification')
WHERE title IS NULL OR message IS NULL;