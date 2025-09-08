import React, { useState } from 'react';
import { Star, X, Crown, Users, Zap, Info } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { createStripeCustomer, createSubscription } from '../lib/stripe';
import { StripeCheckout } from './StripeCheckout';

interface SubscriptionModalProps {
  racerId: string;
  racerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Static subscription tiers data
const STATIC_SUBSCRIPTION_TIERS = [
  {
    id: 'fan-tier',
    racer_id: '',
    tier_name: 'Fan',
    price_cents: 1500, // $15.00 (mapped to existing recurring price)
    description: 'Basic fan support with exclusive content access',
    benefits: [
      'Exclusive behind-the-scenes content',
      'Early access to race updates',
      'Fan-only posts and stories',
      'Support your favorite racer'
    ],
    is_active: true,
    // Existing recurring price ID (Option A)
    stripe_price_id: 'price_1RsPsqHF5unOiVE9cqp68m1B'
  },
  {
    id: 'supporter-tier',
    racer_id: '',
    tier_name: 'Supporter',
    price_cents: 4500, // $45.00 (mapped to existing recurring price)
    description: 'Enhanced supporter experience with premium benefits',
    benefits: [
      'All Fan tier benefits',
      'Monthly Q&A sessions',
      'Personalized thank you messages',
      'Priority comment responses',
      'Exclusive race day content'
    ],
    is_active: true,
    // Existing recurring price ID (Option A)
    stripe_price_id: 'price_1RsQUmHF5unOiVE9ZA5CLd3K'
  },
  {
    id: 'vip-tier',
    racer_id: '',
    tier_name: 'VIP',
    price_cents: 9900, // $99.00 (mapped to existing recurring price)
    description: 'Premium VIP experience with maximum benefits',
    benefits: [
      'All Supporter tier benefits',
      'Private meet & greet opportunities',
      'Custom shoutout videos',
      'Exclusive merchandise discounts',
      'Direct messaging access',
      'VIP-only live streams'
    ],
    is_active: true,
    // Existing recurring price ID (Option A)
    stripe_price_id: 'price_1RygD6HF5unOiVE9QKpnkmmr'
  }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  racerId,
  racerName,
  onClose,
  onSuccess
}) => {
  const { user } = useUser();
  const [tiers] = useState(STATIC_SUBSCRIPTION_TIERS);
  const [selectedTier, setSelectedTier] = useState(STATIC_SUBSCRIPTION_TIERS[0]);
  const [showCheckout] = useState(false);
  const [loading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileDetailsFor, setMobileDetailsFor] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showStripeOverlay, setShowStripeOverlay] = useState(false);
  const [billingEmailState, setBillingEmailState] = useState<string>('');

  const getTierIcon = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('vip') || name.includes('premium')) return Crown;
    if (name.includes('supporter') || name.includes('super')) return Zap;
    return Users;
  };

  const getTierColor = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('vip') || name.includes('premium')) return 'text-purple-400';
    if (name.includes('supporter') || name.includes('super')) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    if (!selectedTier) {
      setError('Please select a subscription tier');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user email for billing details
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const billingEmail = authUser?.email || userProfile?.email || user.email || '';
      setBillingEmailState(billingEmail);

      // 1) Ensure Stripe customer
      const customer = await createStripeCustomer(billingEmail, user.name || billingEmail.split('@')[0] || 'Fan', {
        user_id: user.id,
        user_type: 'fan'
      });

      // 2) Create subscription via Edge Function.
      // Prefer Checkout Session if URLs are provided; fallback to direct subscription.
      const successUrl = `${window.location.origin}/payment/success?type=subscription&racer=${encodeURIComponent(racerName)}&tier=${encodeURIComponent(selectedTier.tier_name)}`;
      const cancelUrl = `${window.location.origin}/racer/${racerId}`;

      const sub = await createSubscription(
        customer.customer_id,
        selectedTier.stripe_price_id,
        {
          racer_id: racerId,
          user_id: user.id,
          tier_id: selectedTier.id,
          tier_name: selectedTier.tier_name
        },
        { success_url: successUrl, cancel_url: cancelUrl }
      );

      // If Edge Function returned a Checkout Session URL, redirect
      if (sub?.url) {
        window.location.href = sub.url as string;
        return;
      }

      // Otherwise expect client_secret for in-app confirmation
      if (sub?.client_secret) {
        setClientSecret(sub.client_secret as string);
        setShowStripeOverlay(true);
      } else {
        throw new Error('Subscription response missing url and client_secret');
      }

    } catch (error) {
      console.error('❌ Subscription error:', error);
      setError('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCheckout && selectedTier && user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fedex-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Sign In Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to subscribe to racers.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fedex-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white">Subscribe to {racerName}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {tiers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No subscription tiers available yet.</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Classic cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const TierIcon = getTierIcon(tier.tier_name);
                const isSelected = selectedTier?.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    role="button"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTier(tier)}
                    className={`rounded-xl border transition-all bg-gray-900/60 ${
                      isSelected ? 'border-fedex-orange shadow-[0_0_0_2px_rgba(255,102,0,0.2)]' : 'border-gray-700 hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TierIcon className="h-5 w-5 text-fedex-orange" />
                          <h4 className="text-base font-semibold text-white">{tier.tier_name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">${(tier.price_cents / 100).toFixed(2)}</div>
                          <div className="text-xs text-gray-400">/month</div>
                        </div>
                      </div>
                      {tier.description && (
                        <p className="text-gray-400 text-sm mt-2">{tier.description}</p>
                      )}
                      <div className="mt-3 space-y-2">
                        {tier.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-fedex-orange" />
                            <span className="text-gray-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setSelectedTier(tier)}
                        className={`w-full rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                          isSelected
                            ? 'bg-fedex-orange text-black hover:bg-fedex-orange/90'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Choose'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary and actions */}
            {selectedTier && (
              <div className="mt-4 rounded-xl border border-gray-700 bg-gray-900/60 p-4 text-sm">
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>{racerName} receives (80%)</span>
                  <span className="text-green-400">${((selectedTier.price_cents * 0.8) / 100).toFixed(2)}/month</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform fee (20%)</span>
                  <span>${((selectedTier.price_cents * 0.2) / 100).toFixed(2)}/month</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribe}
                disabled={!selectedTier || isLoading}
                className="flex-1 px-3 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-semibold text-sm transition-colors"
              >
                {isLoading ? 'Processing...' : `Subscribe $${(selectedTier?.price_cents ?? 0) / 100}/mo`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>

      {showStripeOverlay && clientSecret && user && (
        <StripeCheckout
          type="subscription"
          amount={selectedTier?.price_cents || 0}
          racerId={racerId}
          userId={user.id}
          userEmail={billingEmailState}
          userName={user.name || 'Fan'}
          description={`Subscription (${selectedTier?.tier_name}) for ${racerName}`}
          metadata={{ racer_id: racerId, user_id: user.id, tier_id: selectedTier?.id }}
          clientSecret={clientSecret}
          onSuccess={() => {
            setShowStripeOverlay(false);
            onSuccess?.();
          }}
          onCancel={() => setShowStripeOverlay(false)}
        />
      )}
    </>
  );
};