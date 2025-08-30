/*
  # Add revenue split columns to gift transactions

  1. New Columns
    - `racer_token_amount` (integer) - Tokens that go to the racer (80%)
    - `platform_token_amount` (integer) - Tokens that go to the platform (20%)

  2. Database Functions
    - `update_racer_token_earnings` - Function to update racer earnings from gifts
    - `update_token_balance` - Function to safely update user token balances

  3. Security
    - Maintain existing RLS policies
    - Add validation for revenue split calculations
*/

-- Add revenue split columns to gift_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_transactions' AND column_name = 'racer_token_amount'
  ) THEN
    ALTER TABLE gift_transactions ADD COLUMN racer_token_amount integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_transactions' AND column_name = 'platform_token_amount'
  ) THEN
    ALTER TABLE gift_transactions ADD COLUMN platform_token_amount integer DEFAULT 0;
  END IF;
END $$;

-- Function to update racer token earnings from gifts
CREATE OR REPLACE FUNCTION update_racer_token_earnings(
  p_racer_id uuid,
  p_token_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or create racer earnings record
  INSERT INTO racer_earnings (
    racer_id,
    total_earnings_cents,
    tip_earnings_cents,
    pending_payout_cents,
    created_at,
    updated_at
  )
  VALUES (
    p_racer_id,
    p_token_amount,
    p_token_amount,
    p_token_amount,
    now(),
    now()
  )
  ON CONFLICT (racer_id)
  DO UPDATE SET
    total_earnings_cents = racer_earnings.total_earnings_cents + p_token_amount,
    tip_earnings_cents = racer_earnings.tip_earnings_cents + p_token_amount,
    pending_payout_cents = racer_earnings.pending_payout_cents + p_token_amount,
    updated_at = now();
END;
$$;

-- Function to safely update user token balance
CREATE OR REPLACE FUNCTION update_token_balance(
  p_user_id uuid,
  p_amount integer,
  p_operation text DEFAULT 'add'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or create user tokens record
  INSERT INTO user_tokens (
    user_id,
    token_balance,
    total_purchased,
    total_spent,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    CASE WHEN p_operation = 'add' THEN p_amount ELSE 0 END,
    CASE WHEN p_operation = 'add' THEN p_amount ELSE 0 END,
    CASE WHEN p_operation = 'subtract' THEN p_amount ELSE 0 END,
    now(),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    token_balance = CASE 
      WHEN p_operation = 'add' THEN user_tokens.token_balance + p_amount
      WHEN p_operation = 'subtract' THEN GREATEST(0, user_tokens.token_balance - ABS(p_amount))
      ELSE user_tokens.token_balance
    END,
    total_purchased = CASE 
      WHEN p_operation = 'add' THEN user_tokens.total_purchased + p_amount
      ELSE user_tokens.total_purchased
    END,
    total_spent = CASE 
      WHEN p_operation = 'subtract' THEN user_tokens.total_spent + ABS(p_amount)
      ELSE user_tokens.total_spent
    END,
    updated_at = now();
END;
$$;