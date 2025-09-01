import React, { useState } from 'react';
import { DollarSign, Heart, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { createCheckoutSession } from '../lib/stripe';

interface TipModalProps {
  racerId: string;
  racerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({
  racerId,
  racerName,
  onClose,
  onSuccess
}) => {
  const { user } = useApp();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAmounts = [5, 10, 25, 50, 100];

  const handleTip = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount < 1) {
      alert('Minimum tip amount is $1');
      return;
    }
    if (!user) return;

    try {
      setError(null);
      setShowCheckout(true);

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // Create a Stripe Checkout Session via Supabase Edge Function
      const response = await createCheckoutSession({
        mode: 'payment',
        amountCents: Math.round(amount * 100),
        user_id: user.id,
        racerId: racerId,
        customerEmail: user.email,
        description: `Tip for ${racerName}`,
        type: 'tip',
        success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&racer=${encodeURIComponent(racerName)}&tip=${amount}`,
        cancel_url: `${origin}/racer/${racerId}`
      });

      if (response?.url) {
        // Optionally store context for success page to use
        try {
          localStorage.setItem('pendingTipSuccess', JSON.stringify({
            racerId,
            racerName,
            amount,
            fanId: user.id,
            fanName: user.name
          }));
        } catch {}

        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (e) {
      console.error('Tip checkout error:', e);
      setError('Failed to start checkout. Please try again.');
      setShowCheckout(false);
    }
  };

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Sign In Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to send tips to racers.</p>
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

  if (showCheckout) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Send a Tip
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-400">Support {racerName}'s racing journey</p>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`p-3 rounded-lg font-semibold transition-colors ${
                selectedAmount === amount && !customAmount
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(0);
              }}
              className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTip}
            disabled={finalAmount < 1}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <DollarSign className="h-4 w-4" />
            <span>Tip ${finalAmount.toFixed(2)}</span>
          </button>
        </div>
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};