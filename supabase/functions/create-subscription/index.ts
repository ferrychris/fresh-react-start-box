import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customer_id, price_id, metadata = {} } = await req.json()

    if (!customer_id || !price_id) {
      throw new Error('Customer ID and Price ID are required')
    }

    // Create subscription with Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customer_id,
        'items[0][price]': price_id,
        'payment_behavior': 'default_incomplete',
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'expand[]': 'latest_invoice.payment_intent',
        'metadata[racer_id]': metadata.racer_id || '',
        'metadata[user_id]': metadata.user_id || '',
        'metadata[tier_id]': metadata.tier_id || '',
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe API error:', error)
      throw new Error(`Stripe API error: ${error}`)
    }

    const subscription = await stripeResponse.json()

    // Store subscription in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        stripe_payment_intent_id: subscription.latest_invoice.payment_intent.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer_id,
        transaction_type: 'subscription',
        payer_id: metadata.user_id,
        racer_id: metadata.racer_id,
        subscription_tier_id: metadata.tier_id,
        total_amount_cents: subscription.latest_invoice.amount_due,
        racer_amount_cents: Math.round(subscription.latest_invoice.amount_due * 0.8),
        platform_amount_cents: Math.round(subscription.latest_invoice.amount_due * 0.2),
        status: 'pending',
        metadata: metadata
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        client_secret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating subscription:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create subscription',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})