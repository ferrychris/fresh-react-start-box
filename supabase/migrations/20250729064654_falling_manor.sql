/*
  # Token and Gift System

  1. New Tables
    - `user_tokens`
      - `user_id` (uuid, foreign key to profiles)
      - `token_balance` (integer, default 0)
      - `total_purchased` (integer, default 0)
      - `total_spent` (integer, default 0)
    - `virtual_gifts`
      - `id` (uuid, primary key)
      - `name` (text, gift name)
      - `description` (text, gift description)
      - `token_cost` (integer, cost in tokens)
      - `emoji` (text, gift emoji/icon)
      - `rarity` (text, common/rare/epic/legendary)
      - `is_active` (boolean, default true)
    - `gift_transactions`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `receiver_id` (uuid, foreign key to racer_profiles)
      - `gift_id` (uuid, foreign key to virtual_gifts)
      - `token_amount` (integer, tokens spent)
      - `message` (text, optional message)
      - `is_public` (boolean, show on profile)
      - `created_at` (timestamp)
    - `token_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `token_amount` (integer, tokens purchased)
      - `price_cents` (integer, price paid in cents)
      - `stripe_payment_intent_id` (text, unique)
      - `status` (text, pending/completed/failed)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage own tokens
    - Add policies for gift transactions
    - Add policies for viewing public gifts

  3. Functions
    - Function to update token balances
    - Function to process gift transactions
    - Function to get racer gift stats
*/

-- User Tokens Table
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token_balance integer DEFAULT 0 NOT NULL,
  total_purchased integer DEFAULT 0 NOT NULL,
  total_spent integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON user_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON user_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage tokens"
  ON user_tokens
  FOR ALL
  TO authenticated
  USING (true);

-- Virtual Gifts Table
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  token_cost integer NOT NULL,
  emoji text NOT NULL,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active gifts"
  ON virtual_gifts
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Gift Transactions Table
CREATE TABLE IF NOT EXISTS gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES virtual_gifts(id) ON DELETE CASCADE,
  token_amount integer NOT NULL,
  message text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public gifts"
  ON gift_transactions
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own sent gifts"
  ON gift_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Racers can read received gifts"
  ON gift_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts"
  ON gift_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Token Purchases Table
CREATE TABLE IF NOT EXISTS token_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token_amount integer NOT NULL,
  price_cents integer NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON token_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage purchases"
  ON token_purchases
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default virtual gifts
INSERT INTO virtual_gifts (name, description, token_cost, emoji, rarity) VALUES
('Checkered Flag', 'Show your racing spirit!', 10, '🏁', 'common'),
('Trophy', 'Celebrate their victory!', 25, '🏆', 'common'),
('Racing Helmet', 'Safety first, speed second!', 50, '🏎️', 'rare'),
('Fire Boost', 'They''re on fire!', 75, '🔥', 'rare'),
('Lightning Bolt', 'Lightning fast!', 100, '⚡', 'epic'),
('Crown', 'Racing royalty!', 150, '👑', 'epic'),
('Diamond Trophy', 'Ultimate champion!', 500, '💎', 'legendary'),
('Golden Wrench', 'Master mechanic!', 300, '🔧', 'legendary');

-- Function to update token balance
CREATE OR REPLACE FUNCTION update_token_balance(
  p_user_id uuid,
  p_amount integer,
  p_operation text -- 'add' or 'subtract'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_operation = 'add' THEN
    INSERT INTO user_tokens (user_id, token_balance, total_purchased)
    VALUES (p_user_id, p_amount, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET
      token_balance = user_tokens.token_balance + p_amount,
      total_purchased = user_tokens.total_purchased + p_amount,
      updated_at = now();
  ELSIF p_operation = 'subtract' THEN
    UPDATE user_tokens
    SET 
      token_balance = token_balance - p_amount,
      total_spent = total_spent + p_amount,
      updated_at = now()
    WHERE user_id = p_user_id AND token_balance >= p_amount;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient token balance';
    END IF;
  END IF;
END;
$$;

-- Function to send gift
CREATE OR REPLACE FUNCTION send_virtual_gift(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_gift_id uuid,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gift_cost integer;
  v_transaction_id uuid;
BEGIN
  -- Get gift cost
  SELECT token_cost INTO v_gift_cost
  FROM virtual_gifts
  WHERE id = p_gift_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift not found or inactive';
  END IF;
  
  -- Check user has enough tokens
  IF NOT EXISTS (
    SELECT 1 FROM user_tokens 
    WHERE user_id = p_sender_id AND token_balance >= v_gift_cost
  ) THEN
    RAISE EXCEPTION 'Insufficient tokens';
  END IF;
  
  -- Deduct tokens
  PERFORM update_token_balance(p_sender_id, v_gift_cost, 'subtract');
  
  -- Create gift transaction
  INSERT INTO gift_transactions (sender_id, receiver_id, gift_id, token_amount, message)
  VALUES (p_sender_id, p_receiver_id, p_gift_id, v_gift_cost, p_message)
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Trigger to update token balances
CREATE TRIGGER update_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_transactions_receiver_id ON gift_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_sender_id ON gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_created_at ON gift_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);