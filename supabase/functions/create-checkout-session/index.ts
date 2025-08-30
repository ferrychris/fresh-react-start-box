import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const {
      mode, // 'payment' | 'subscription'
      amountCents, // for payment
      priceId,     // for subscription
      user_id,
      racerId,
      customerEmail,
      description,
      type, // 'tip' | 'subscription' | 'sponsorship' | 'tokens'
      tokenCount,
      success_url,
      cancel_url,
      currency = 'usd',
    } = body || {};

    if (!mode || !success_url || !cancel_url) {
      throw new Error('mode, success_url and cancel_url are required');
    }

    if (mode === 'payment' && (!amountCents || amountCents < 50)) {
      throw new Error('Valid amountCents (>=50) is required for payment mode');
    }

    if (mode === 'subscription' && !priceId) {
      throw new Error('priceId is required for subscription mode');
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY not configured');

    // Build request to Stripe Checkout Sessions API
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('success_url', success_url);
    params.set('cancel_url', cancel_url);
    if (customerEmail) params.set('customer_email', customerEmail);

    // Pass identifiers through metadata for webhook reconciliation
    if (user_id) params.set('metadata[user_id]', user_id);
    if (racerId) params.set('metadata[racer_id]', racerId);
    if (type) params.set('metadata[type]', type);
    if (description) params.set('metadata[description]', description);
    if (typeof tokenCount === 'number') params.set('metadata[token_count]', String(tokenCount));

    // Expand payment_intent so we can write a pending transaction immediately
    params.append('expand[]', 'payment_intent');

    if (mode === 'payment') {
      // One-time payment (tip)
      params.set('line_items[0][price_data][currency]', currency);
      params.set('line_items[0][price_data][product_data][name]', description || 'Support Tip');
      params.set('line_items[0][price_data][unit_amount]', String(amountCents));
      params.set('line_items[0][quantity]', '1');

      // Ensure PaymentIntent carries metadata too
      if (user_id) params.set('payment_intent_data[metadata][user_id]', user_id);
      if (racerId) params.set('payment_intent_data[metadata][racer_id]', racerId);
      if (type) params.set('payment_intent_data[metadata][type]', type);
      if (description) params.set('payment_intent_data[metadata][description]', description);
      if (typeof tokenCount === 'number') params.set('payment_intent_data[metadata][token_count]', String(tokenCount));
    } else if (mode === 'subscription') {
      // Subscription (recurring)
      params.set('line_items[0][price]', priceId);
      params.set('line_items[0][quantity]', '1');
      // Put metadata on subscription as well
      if (user_id) params.set('subscription_data[metadata][user_id]', user_id);
      if (racerId) params.set('subscription_data[metadata][racer_id]', racerId);
      if (type) params.set('subscription_data[metadata][type]', type);
      if (description) params.set('subscription_data[metadata][description]', description);
    }

    const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!stripeResp.ok) {
      const errText = await stripeResp.text();
      console.error('Stripe error:', errText);
      throw new Error(`Stripe API error: ${errText}`);
    }

    const session = await stripeResp.json();

    // Insert pending transaction using expanded payment_intent if available
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const paymentIntentId = session?.payment_intent?.id || null;
      const total = mode === 'payment' ? Number(amountCents || 0) : 0;
      const racerAmount = Math.round(total * 0.8);
      const platformAmount = total - racerAmount;

      // Only pre-insert for payment tips where we know the amount now
      // Note: transactions.racer_id is NOT NULL in DB, so only insert when racerId is present
      if (mode === 'payment' && paymentIntentId && racerId) {
        const { error: dbError } = await supabase
          .from('transactions')
          .insert({
            stripe_payment_intent_id: paymentIntentId,
            stripe_customer_id: session.customer ?? null,
            transaction_type: type || 'tip',
            payer_id: user_id || null,
            racer_id: racerId || null,
            total_amount_cents: total,
            racer_amount_cents: racerAmount,
            platform_amount_cents: platformAmount,
            status: 'pending',
            metadata: {
              source: 'checkout_session',
              description,
            }
          });
        if (dbError) console.error('DB insert error (transactions):', dbError);
      }
    } catch (e) {
      console.error('Post-create DB step error:', e);
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
