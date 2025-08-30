import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { email, name, metadata = {} } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Create customer with Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        name: name || '',
        'metadata[user_id]': metadata.user_id || '',
        'metadata[user_type]': metadata.user_type || '',
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe API error:', error)
      throw new Error(`Stripe API error: ${error}`)
    }

    const customer = await stripeResponse.json()

    return new Response(
      JSON.stringify({
        customer_id: customer.id,
        customer_data: customer
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating customer:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create customer',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})