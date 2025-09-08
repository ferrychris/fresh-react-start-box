import React, { useState } from 'react';
import { Star, X, Crown, Users, Zap, Info } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';

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
    price_cents: 999, // $9.99
    description: 'Basic fan support with exclusive content access',
    benefits: [
      'Exclusive behind-the-scenes content',
      'Early access to race updates',
      'Fan-only posts and stories',
      'Support your favorite racer'
    ],
    is_active: true,
    // stripe_price_id: 'price_1RsnL1CTmVSqVkGZF3AGyY3S'
    stripe_price_id: 'price_1RsoF4CTmVSqVkGZnoORXBmr'
  },
  {
    id: 'supporter-tier',
    racer_id: '',
    tier_name: 'Supporter',
    price_cents: 1999, 
    description: 'Enhanced supporter experience with premium benefits',
    benefits: [
      'All Fan tier benefits',
      'Monthly Q&A sessions',
      'Personalized thank you messages',
      'Priority comment responses',
      'Exclusive race day content'
    ],
    is_active: true,
    // stripe_price_id: 'price_1RsnLjCTmVSqVkGZSsx2kkw9'
    stripe_price_id: 'price_1RsoFhCTmVSqVkGZGP8Xt9n0'
  },
  {
    id: 'vip-tier',
    racer_id: '',
    tier_name: 'VIP',
    price_cents: 3999, // $39.99
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
    stripe_price_id: 'price_1RsoG5CTmVSqVkGZDCPhgTM6'
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
      // Get user profile and auth user for email
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: { user: authUser } } = await supabase.auth.getUser();

      console.log('🌐 Making API call to create checkout session...');
      console.log({
        priceId: selectedTier.stripe_price_id || 'price_default',
        uid: user.id,
        racerId: racerId,
        tierName: selectedTier.tier_name,
        priceCents: selectedTier.price_cents
      });

      // Create checkout session via Supabase Edge Function
      const response = await createCheckoutSession({
        mode: 'subscription',
        priceId: selectedTier.stripe_price_id,
        user_id: user.id,
        racerId: racerId,
        tierName: selectedTier.tier_name,
        priceCents: selectedTier.price_cents,
        customerEmail: authUser?.email || userProfile?.email || user.email,
        description: `Subscription (${selectedTier.tier_name}) for ${racerName}`,
        type: 'subscription',
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&racer=${encodeURIComponent(racerName)}&tier=${encodeURIComponent(selectedTier.tier_name)}`,
        cancel_url: `${window.location.origin}/racer/${racerId}`
      });

      // Store subscription data for success page processing
      localStorage.setItem('pendingSubscriptionSuccess', JSON.stringify({
        racerId: racerId,
        racerName: racerName,
        tierName: selectedTier.tier_name,
        fanId: user.id,
        fanName: user.name,
        onSuccessAction: 'create_superfan_notification'
      }));

      // Notify parent that subscription flow started (optional UX hook)
      if (onSuccess) onSuccess();

      if (response?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
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
  );
};