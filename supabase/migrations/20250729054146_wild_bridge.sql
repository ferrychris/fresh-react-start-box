/*
  # Custom Pricing and Revenue System

  1. New Tables
    - `subscription_tiers` - Custom subscription tiers set by racers
    - `sponsorship_packages` - Custom sponsorship packages set by racers  
    - `transactions` - All payments with revenue splitting
    - `racer_earnings` - Track racer earnings and payouts
    - `platform_revenue` - Track platform revenue

  2. Security
    - Enable RLS on all tables
    - Add policies for racers to manage their own pricing
    - Add policies for transaction tracking
*/

-- Subscription Tiers (Custom pricing by racers)
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE NOT NULL,
  tier_name text NOT NULL,
  price_cents integer NOT NULL, -- Store in cents to avoid decimal issues
  description text,
  benefits jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  stripe_price_id text, -- Stripe Price ID for this tier
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sponsorship Packages (Custom pricing by racers)
CREATE TABLE IF NOT EXISTS sponsorship_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE NOT NULL,
  package_name text NOT NULL,
  price_cents integer NOT NULL,
  description text,
  duration_races integer DEFAULT 1, -- How many races this sponsorship covers
  car_placement text, -- 'hood', 'doors', 'spoiler', etc.
  benefits jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- All Transactions (Subscriptions, Tips, Sponsorships)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription', 'tip', 'sponsorship')),
  
  -- Parties involved
  payer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  total_amount_cents integer NOT NULL,
  racer_amount_cents integer NOT NULL, -- 80% of total
  platform_amount_cents integer NOT NULL, -- 20% of total
  
  -- Related records
  subscription_tier_id uuid REFERENCES subscription_tiers(id) ON DELETE SET NULL,
  sponsorship_package_id uuid REFERENCES sponsorship_packages(id) ON DELETE SET NULL,
  
  -- Stripe details
  stripe_customer_id text,
  stripe_subscription_id text, -- For recurring subscriptions
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Racer Earnings Tracking
CREATE TABLE IF NOT EXISTS racer_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Earnings breakdown
  total_earnings_cents integer DEFAULT 0,
  subscription_earnings_cents integer DEFAULT 0,
  tip_earnings_cents integer DEFAULT 0,
  sponsorship_earnings_cents integer DEFAULT 0,
  
  -- Payout tracking
  total_paid_out_cents integer DEFAULT 0,
  pending_payout_cents integer DEFAULT 0,
  
  -- Stripe Connect details
  stripe_account_id text, -- Racer's Stripe Connect account
  payout_schedule text DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'monthly')),
  
  -- Timestamps
  last_payout_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(racer_id)
);

-- Platform Revenue Tracking
CREATE TABLE IF NOT EXISTS platform_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Revenue breakdown
  total_revenue_cents integer DEFAULT 0,
  subscription_revenue_cents integer DEFAULT 0,
  tip_revenue_cents integer DEFAULT 0,
  sponsorship_revenue_cents integer DEFAULT 0,
  
  -- Period tracking
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(period_start, period_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_racer_id ON subscription_tiers(racer_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_packages_racer_id ON sponsorship_packages(racer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_racer_id ON transactions(racer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_racer_earnings_racer_id ON racer_earnings(racer_id);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE racer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Subscription Tiers
CREATE POLICY "Racers can manage own subscription tiers"
  ON subscription_tiers
  FOR ALL
  TO authenticated
  USING (auth.uid() = racer_id)
  WITH CHECK (auth.uid() = racer_id);

CREATE POLICY "Anyone can read active subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for Sponsorship Packages
CREATE POLICY "Racers can manage own sponsorship packages"
  ON sponsorship_packages
  FOR ALL
  TO authenticated
  USING (auth.uid() = racer_id)
  WITH CHECK (auth.uid() = racer_id);

CREATE POLICY "Anyone can read active sponsorship packages"
  ON sponsorship_packages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for Transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = payer_id OR auth.uid() = racer_id);

CREATE POLICY "System can insert transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic

-- RLS Policies for Racer Earnings
CREATE POLICY "Racers can read own earnings"
  ON racer_earnings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = racer_id);

CREATE POLICY "System can manage racer earnings"
  ON racer_earnings
  FOR ALL
  TO authenticated
  USING (true); -- Controlled by application logic

-- RLS Policies for Platform Revenue (Admin only)
CREATE POLICY "Admin can read platform revenue"
  ON platform_revenue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_packages_updated_at
  BEFORE UPDATE ON sponsorship_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_racer_earnings_updated_at
  BEFORE UPDATE ON racer_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate revenue split
CREATE OR REPLACE FUNCTION calculate_revenue_split(total_cents integer)
RETURNS TABLE(racer_amount integer, platform_amount integer) AS $$
BEGIN
  RETURN QUERY SELECT 
    (total_cents * 0.8)::integer as racer_amount,
    (total_cents * 0.2)::integer as platform_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update racer earnings
CREATE OR REPLACE FUNCTION update_racer_earnings(
  p_racer_id uuid,
  p_amount_cents integer,
  p_transaction_type text
) RETURNS void AS $$
BEGIN
  INSERT INTO racer_earnings (racer_id, total_earnings_cents, subscription_earnings_cents, tip_earnings_cents, sponsorship_earnings_cents, pending_payout_cents)
  VALUES (p_racer_id, p_amount_cents, 
    CASE WHEN p_transaction_type = 'subscription' THEN p_amount_cents ELSE 0 END,
    CASE WHEN p_transaction_type = 'tip' THEN p_amount_cents ELSE 0 END,
    CASE WHEN p_transaction_type = 'sponsorship' THEN p_amount_cents ELSE 0 END,
    p_amount_cents)
  ON CONFLICT (racer_id) DO UPDATE SET
    total_earnings_cents = racer_earnings.total_earnings_cents + p_amount_cents,
    subscription_earnings_cents = racer_earnings.subscription_earnings_cents + 
      CASE WHEN p_transaction_type = 'subscription' THEN p_amount_cents ELSE 0 END,
    tip_earnings_cents = racer_earnings.tip_earnings_cents + 
      CASE WHEN p_transaction_type = 'tip' THEN p_amount_cents ELSE 0 END,
    sponsorship_earnings_cents = racer_earnings.sponsorship_earnings_cents + 
      CASE WHEN p_transaction_type = 'sponsorship' THEN p_amount_cents ELSE 0 END,
    pending_payout_cents = racer_earnings.pending_payout_cents + p_amount_cents,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;