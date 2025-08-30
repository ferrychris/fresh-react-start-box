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
    const { amount, currency = 'usd', metadata = {} } = await req.json()

    if (!amount || amount < 50) {
      throw new Error('Amount must be at least $0.50')
    }

    // Calculate revenue split (80% to racer, 20% to platform)
    const platformFee = Math.round(amount * 0.20)
    const racerAmount = amount - platformFee

    // Create payment intent with Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[racer_id]': metadata.racer_id || '',
        'metadata[user_id]': metadata.user_id || '',
        'metadata[type]': metadata.type || '',
        'metadata[transaction_id]': metadata.transaction_id || '',
        'metadata[racer_amount]': racerAmount.toString(),
        'metadata[platform_fee]': platformFee.toString(),
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe API error:', error)
      throw new Error(`Stripe API error: ${error}`)
    }

    const paymentIntent = await stripeResponse.json()

    // Store transaction in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        transaction_type: metadata.type || 'tip',
        payer_id: metadata.user_id,
        racer_id: metadata.racer_id,
        total_amount_cents: amount,
        racer_amount_cents: racerAmount,
        platform_amount_cents: platformFee,
        status: 'pending',
        metadata: metadata
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't throw here, payment intent is already created
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        racer_amount: racerAmount,
        platform_fee: platformFee
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})