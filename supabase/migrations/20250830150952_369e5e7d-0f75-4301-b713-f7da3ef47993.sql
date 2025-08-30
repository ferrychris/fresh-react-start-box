-- Update notifications table to have title and message columns if they don't exist
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