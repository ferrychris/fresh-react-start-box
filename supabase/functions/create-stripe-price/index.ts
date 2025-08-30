import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { product_id, amount, interval } = await req.json()

    // Create price object for Stripe
    const priceData: any = {
      product: product_id,
      unit_amount: amount,
      currency: 'usd',
    }

    // Add recurring data for subscriptions
    if (interval) {
      priceData.recurring = {
        interval: interval
      }
    }

    // Create price with Stripe
    const response = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(priceData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe API error: ${error}`)
    }

    const price = await response.json()

    return new Response(
      JSON.stringify({
        price_id: price.id,
        price_data: price
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating Stripe price:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create Stripe price',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})