// Supabase Edge Function: Stripe Webhook
// Logs all incoming requests and verifies Stripe signature using STRIPE_WEBHOOK_SECRET

// Import Stripe via npm specifier for Deno runtime
import Stripe from 'npm:stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Disable JWT verification for unauthenticated Stripe webhook requests
export const config = { verifyJWT: false };

// Utility to build JSON Response
const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

// Start server
Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const url = new URL(req.url);
  const method = req.method;

  // Basic request receipt log
  console.log('[stripe-webhook] received', { requestId, method, path: url.pathname });

  // Only accept POST
  if (method !== 'POST') {
    console.warn('[stripe-webhook] non-POST request', { requestId, method });
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  // Read env
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const apiKey = Deno.env.get('STRIPE_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!secret) {
    console.error('[stripe-webhook] missing STRIPE_WEBHOOK_SECRET', { requestId });
    return json({ error: 'Server not configured: STRIPE_WEBHOOK_SECRET' }, { status: 500 });
  }
  if (!apiKey) {
    console.error('[stripe-webhook] missing STRIPE_SECRET_KEY', { requestId });
    return json({ error: 'Server not configured: STRIPE_SECRET_KEY' }, { status: 500 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[stripe-webhook] missing Supabase env vars', { requestId, hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
    return json({ error: 'Server not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
    cryptoProvider: Stripe.createSubtleCryptoProvider(),
  });

  // Read signature and raw body
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.warn('[stripe-webhook] missing stripe-signature header', { requestId });
    return json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let rawBody: string;
  try {
    // Important: use raw text body for signature verification
    rawBody = await req.text();
  } catch (e) {
    console.error('[stripe-webhook] failed to read body', { requestId, error: String(e) });
    return json({ error: 'Invalid body' }, { status: 400 });
  }

  // Verify and construct event
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // Log event summary
  console.log('[stripe-webhook] event received', {
    requestId,
    id: event.id,
    type: event.type,
    created: event.created,
  });

  // Create Supabase client (service role) per request
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[stripe-webhook] checkout.session.completed', {
          requestId,
          sessionId: session.id,
          mode: session.mode,
          customer: session.customer,
          customer_email: session.customer_details?.email,
          metadata: session.metadata,
        });
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const userId = session.metadata?.user_id as string | undefined;

        // 1) Mark related transaction as completed for any one-time payment
        try {
          if (session.mode === 'payment' && paymentIntentId) {
            const updates: Record<string, unknown> = {
              status: 'completed',
              processed_at: new Date().toISOString(),
            };
            await supabase
              .from('transactions')
              .update(updates)
              .eq('stripe_payment_intent_id', paymentIntentId);
          }
        } catch (txErr) {
          console.error('[stripe-webhook] transactions update error', { requestId, error: String(txErr) });
        }

        // 2) Fulfill token purchases
        if (session.mode === 'payment' && session.metadata?.type === 'tokens') {
          const tokenCountStr = (session.metadata.token_count as string | undefined) || '0';
          const tokenCount = parseInt(tokenCountStr, 10) || 0;
          const amountTotal = (session.amount_total ?? 0) as number; // in cents

          if (!userId || !tokenCount) {
            console.warn('[stripe-webhook] tokens fulfillment skipped: missing userId or tokenCount', { requestId, userId, tokenCount });
            break;
          }

          // Insert token_purchases record
          const { error: insertPurchaseError } = await supabase
            .from('token_purchases')
            .insert({
              user_id: userId,
              token_amount: tokenCount,
              price_cents: amountTotal ?? 0,
              stripe_payment_intent_id: paymentIntentId || null,
              status: 'completed',
            });
          if (insertPurchaseError) {
            console.error('[stripe-webhook] token_purchases insert error', { requestId, error: insertPurchaseError });
          }

          // Credit tokens to user (RPC preferred)
          let creditOk = false;
          try {
            const { error: rpcError } = await (supabase as any).rpc('update_token_balance', {
              p_user_id: userId,
              p_amount: tokenCount,
              p_operation: 'add',
            });
            if (rpcError) throw rpcError;
            creditOk = true;
          } catch (rpcErr) {
            console.warn('[stripe-webhook] RPC update_token_balance failed, falling back to upsert', { requestId, error: String(rpcErr) });
            const { data: existing, error: fetchErr } = await supabase
              .from('user_tokens')
              .select('user_id, token_balance, total_purchased')
              .eq('user_id', userId)
              .maybeSingle();
            if (fetchErr) {
              console.error('[stripe-webhook] user_tokens fetch error', { requestId, error: fetchErr });
            } else {
              const newBalance = (existing?.token_balance || 0) + tokenCount;
              const newPurchased = (existing?.total_purchased || 0) + tokenCount;
              const { error: upsertErr } = await supabase
                .from('user_tokens')
                .upsert({ user_id: userId, token_balance: newBalance, total_purchased: newPurchased });
              if (upsertErr) {
                console.error('[stripe-webhook] user_tokens upsert error', { requestId, error: upsertErr });
              } else {
                creditOk = true;
              }
            }
          }

          console.log('[stripe-webhook] tokens purchase fulfilled', { requestId, userId, tokenCount, creditOk });
        }

        // 3) Recompute fan metrics for payer
        try {
          if (userId) {
            const { error: mErr } = await (supabase as any).rpc('recompute_fan_metrics', { p_user_id: userId });
            if (mErr) console.error('[stripe-webhook] recompute_fan_metrics error', { requestId, error: mErr });
          }
        } catch (e) {
          console.error('[stripe-webhook] recompute_fan_metrics exception', { requestId, error: String(e) });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[stripe-webhook] invoice.payment_succeeded', {
          requestId,
          invoiceId: invoice.id,
          customer: invoice.customer,
          subscription: invoice.subscription,
        });
        // Try to recompute metrics for the subscription owner
        try {
          const subId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            const userId = (sub.metadata as any)?.user_id as string | undefined;
            if (userId) {
              const { error: mErr } = await (supabase as any).rpc('recompute_fan_metrics', { p_user_id: userId });
              if (mErr) console.error('[stripe-webhook] recompute_fan_metrics (invoice) error', { requestId, error: mErr });
            }
          }
        } catch (e) {
          console.error('[stripe-webhook] invoice metrics recompute exception', { requestId, error: String(e) });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] ${event.type}`, {
          requestId,
          subscriptionId: sub.id,
          status: sub.status,
          items: sub.items?.data?.length,
        });
        // Upsert to user_subscriptions and recompute fan metrics
        try {
          const userId = (sub.metadata as any)?.user_id as string | undefined;
          const currentPeriodEndIso = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

          if (userId) {
            const { error: upErr } = await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: userId,
                stripe_subscription_id: sub.id,
                status: sub.status,
                current_period_end: currentPeriodEndIso,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'stripe_subscription_id' } as any);
            if (upErr) console.error('[stripe-webhook] user_subscriptions upsert error', { requestId, error: upErr });

            const { error: mErr } = await (supabase as any).rpc('recompute_fan_metrics', { p_user_id: userId });
            if (mErr) console.error('[stripe-webhook] recompute_fan_metrics (subscription) error', { requestId, error: mErr });
          } else {
            console.warn('[stripe-webhook] subscription missing user_id in metadata; cannot update fan metrics');
          }
        } catch (e) {
          console.error('[stripe-webhook] subscription upsert/recompute exception', { requestId, error: String(e) });
        }
        break;
      }
      default: {
        console.log('[stripe-webhook] unhandled event type', { requestId, type: event.type });
      }
    }
  } catch (e) {
    console.error('[stripe-webhook] handler error', { requestId, error: String(e) });
    // Respond 200 to avoid repeated retries if handling is non-critical; adjust to 500 if you want Stripe to retry
    return json({ received: true, handlerError: true }, { status: 200 });
  }

  // Acknowledge receipt to Stripe
  return json({ received: true }, { status: 200 });
});


                                                                                                                