import React, { useState } from 'react';
import { DollarSign, CreditCard, Lock } from 'lucide-react';
import { 
  createTransaction, 
  calculateRevenueSplit,
  type SubscriptionTier,
  type SponsorshipPackage 
} from '../lib/supabase';

interface StripePaymentProps {
  type: 'subscription' | 'tip' | 'sponsorship';
  racerId: string;
  userId: string;
  subscriptionTier?: SubscriptionTier;
  sponsorshipPackage?: SponsorshipPackage;
  tipAmount?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  type,
  racerId,
  userId,
  subscriptionTier,
  sponsorshipPackage,
  tipAmount,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAmount = () => {
    switch (type) {
      case 'subscription':
        return subscriptionTier?.price_cents || 0;
      case 'sponsorship':
        return sponsorshipPackage?.price_cents || 0;
      case 'tip':
        return (tipAmount || 0) * 100; // Convert dollars to cents
      default:
        return 0;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'subscription':
        return `${subscriptionTier?.tier_name} subscription`;
      case 'sponsorship':
        return `${sponsorshipPackage?.package_name} sponsorship`;
      case 'tip':
        return `Tip for racer`;
      default:
        return 'Payment';
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const totalAmount = getAmount();
      const { racerAmount, platformAmount } = calculateRevenueSplit(totalAmount);

      // Create transaction record first
      const transactionData = {
        stripe_payment_intent_id: `temp_${Date.now()}`, // Will be updated by webhook
        transaction_type: type,
        payer_id: userId,
        racer_id: racerId,
        total_amount_cents: totalAmount,
        racer_amount_cents: racerAmount,
        platform_amount_cents: platformAmount,
        subscription_tier_id: subscriptionTier?.id,
        sponsorship_package_id: sponsorshipPackage?.id,
        status: 'pending',
        metadata: {
          description: getDescription(),
          tip_amount: tipAmount
        }
      };

      const transaction = await createTransaction(transactionData);

      // Create Stripe Payment Intent
      const response = await fetch('https://race-fans-server.vercel.app/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'usd',
          description: getDescription(),
          metadata: {
            transaction_id: transaction.id,
            racer_id: racerId,
            user_id: userId,
            type: type
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Update transaction with real payment intent ID
      const paymentIntentId = client_secret.split('_secret_')[0];
      await supabase
        .from('transactions')
        .update({ stripe_payment_intent_id: paymentIntentId })
        .eq('id', transaction.id);

      // Here you would integrate with Stripe Elements or redirect to Stripe Checkout
      // For now, we'll simulate a successful payment
      setTimeout(() => {
        onSuccess?.();
        setLoading(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const totalAmount = getAmount();
  const { racerAmount, platformAmount } = calculateRevenueSplit(totalAmount);

  return (
    <div className="bg-gray-900 rounded-xl p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Complete Payment</h3>
        <p className="text-gray-400">{getDescription()}</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Amount</span>
          <span className="text-2xl font-bold text-green-400">
            {formatPrice(totalAmount)}
          </span>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Racer receives (80%)</span>
            <span className="text-green-400">{formatPrice(racerAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee (20%)</span>
            <span>{formatPrice(platformAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Form Placeholder */}
      <div className="space-y-4 mb-6">
        <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center">
          <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 text-sm">
            Stripe payment form would appear here
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-6">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe</span>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4" />
              <span>Pay {formatPrice(totalAmount)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};