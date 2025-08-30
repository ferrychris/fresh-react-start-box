import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Create Connect Account function called');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const { racer_id, email } = await req.json()
    console.log('📋 Request data:', { racer_id, email });

    if (!racer_id || !email) {
      throw new Error('Racer ID and email are required')
    }

    // Validate Stripe API key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment');
      console.log('📋 Available env vars:', Object.keys(Deno.env.toObject()));
      throw new Error('Stripe secret key not configured in edge function environment. Please add STRIPE_SECRET_KEY to your Supabase project secrets.');
    }

    console.log('✅ Stripe secret key found');
    console.log('Creating Stripe Connect account for:', { racer_id, email })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('✅ Supabase client initialized');

    // Check if account already exists
    const { data: existingEarnings, error: earningsError } = await supabase
      .from('racer_earnings')
      .select('stripe_account_id')
      .eq('racer_id', racer_id)
      .maybeSingle()

    if (earningsError) {
      console.error('Error checking existing earnings:', earningsError)
      // Continue anyway - we'll create a new record
    }

    if (existingEarnings?.stripe_account_id) {
      console.log('Account already exists, creating new onboarding link')
      
      // Account already exists, create new onboarding link
      const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          account: existingEarnings.stripe_account_id,
          refresh_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard?setup=stripe`,
          return_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard?stripe=connected`,
          type: 'account_onboarding',
        }),
      })

      if (!linkResponse.ok) {
        const error = await linkResponse.text()
        console.error('Failed to create account link:', error)
        throw new Error(`Failed to create account link: ${error}`)
      }

      const accountLink = await linkResponse.json()

      return new Response(
        JSON.stringify({
          account_id: existingEarnings.stripe_account_id,
          onboarding_url: accountLink.url,
          existing_account: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create new Stripe Connect Express account
    console.log('Creating new Stripe Connect account')
    
    const stripeResponse = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'express',
        email,
        country: 'US',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'business_type': 'individual',
        'business_profile[mcc]': '7922', // Public golf courses (closest to racing)
        'business_profile[url]': `${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}/racer/${racer_id}`,
        'metadata[racer_id]': racer_id,
        'metadata[platform]': 'onlyracefans',
        'settings[payouts][schedule][interval]': 'weekly',
        'settings[payouts][schedule][weekly_anchor]': 'friday',
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe API error:', error)
      throw new Error(`Stripe API error: ${error}`)
    }

    const account = await stripeResponse.json()
    console.log('Stripe account created:', account.id)

    // Create account link for onboarding
    const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard?setup=stripe`,
        return_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard?stripe=connected`,
        type: 'account_onboarding',
      }),
    })

    if (!linkResponse.ok) {
      const error = await linkResponse.text()
      console.error('Stripe link error:', error)
      throw new Error(`Failed to create account link: ${error}`)
    }

    const accountLink = await linkResponse.json()

    // Update or create racer earnings record with Stripe account ID
    const { error: dbError } = await supabase
      .from('racer_earnings')
      .upsert({
        racer_id,
        stripe_account_id: account.id,
        total_earnings_cents: 0,
        subscription_earnings_cents: 0,
        tip_earnings_cents: 0,
        sponsorship_earnings_cents: 0,
        total_paid_out_cents: 0,
        pending_payout_cents: 0,
        payout_schedule: 'weekly',
        last_payout_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'racer_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if database update fails - the account was created successfully
      console.warn('Continuing despite database error - account created successfully')
    } else {
      console.log('Racer earnings record created/updated for:', racer_id)
    }

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboarding_url: accountLink.url,
        account_data: {
          id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted
        },
        existing_account: false,
        payout_schedule: 'weekly',
        minimum_payout: 2500 // $25.00 in cents
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating Connect account:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create Connect account',
        details: error.message,
        timestamp: new Date().toISOString(),
        racer_id: req.body ? JSON.parse(req.body).racer_id : 'unknown'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})