import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key - handle missing key gracefully
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const getStripe = () => {
  if (!publishableKey) {
    console.warn('Stripe publishable key not found. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
    return null;
  }
  return stripePromise;
};

// Create a Stripe Checkout Session (tips/subscriptions)
export const createCheckoutSession = async (payload: any) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      // Authorization header with anon key removed per request to avoid exposing token in client headers
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let error: any = {};
    try { error = await response.json(); } catch {}
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json(); // can be { url, id, type } or { subscription_id, client_secret, status }
};

// Stripe API helpers for frontend
export const createPaymentIntent = async (amount: number, currency = 'usd', metadata = {}) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      // Authorization header removed per request
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      metadata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
};

export const createSubscription = async (
  customerId: string,
  priceId: string,
  metadata: Record<string, any> = {},
  options?: { success_url?: string; cancel_url?: string }
) => {
  const payload: any = {
    customer_id: customerId,
    price_id: priceId,
    metadata,
  };
  if (options?.success_url) payload.success_url = options.success_url;
  if (options?.cancel_url) payload.cancel_url = options.cancel_url;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-session`, {
    method: 'POST',
    headers: {
      // Authorization header removed per request
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription');
  }

  return response.json();
};

export const createStripePrice = async (productId: string, amount: number, interval?: 'month' | 'year') => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-price`, {
    method: 'POST',
    headers: {
      // Authorization header removed per request
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      amount,
      interval
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Stripe price');
  }

  return response.json();
};

export const createStripeCustomer = async (email: string, name: string, metadata = {}) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
    method: 'POST',
    headers: {
      // Authorization header removed per request
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      name,
      metadata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Stripe customer');
  }

  return response.json();
};

export const createConnectAccount = async (racerId: string, email: string) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`, {
    method: 'POST',
    headers: {
      // Authorization header removed per request
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      racer_id: racerId,
      email
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Connect account');
  }

  return response.json();
};

// Format currency for display
export const formatCurrency = (cents: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
};

// Calculate platform fee (20%) and racer amount (80%)
export const calculateRevenueSplit = (totalCents: number) => {
  const platformFee = Math.round(totalCents * 0.20);
  const racerAmount = totalCents - platformFee;
  return { racerAmount, platformFee };
};