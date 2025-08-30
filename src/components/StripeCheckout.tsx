import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  Lock, 
  DollarSign, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { createPaymentIntent, createStripeCustomer, formatCurrency } from '../lib/stripe';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutProps {
  type: 'subscription' | 'tip' | 'sponsorship';
  amount: number; // in cents
  racerId: string;
  userId: string;
  userEmail: string;
  userName: string;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
  metadata?: Record<string, any>;
}

const CheckoutForm: React.FC<StripeCheckoutProps> = ({
  type,
  amount,
  racerId,
  userId,
  userEmail,
  userName,
  description,
  onSuccess,
  onCancel,
  metadata = {}
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create customer if needed
      const customer = await createStripeCustomer(userEmail, userName, {
        user_id: userId,
        user_type: 'fan'
      });

      // Create payment intent
      const { client_secret } = await createPaymentIntent(amount, 'usd', {
        racer_id: racerId,
        user_id: userId,
        type,
        customer_id: customer.customer_id,
        description,
        ...metadata
      });

      // Confirm payment
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: userName,
            email: userEmail,
          },
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        setSucceeded(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#1f2937',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-gray-400">Thank you for your support!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Total Amount</span>
          <span className="text-2xl font-bold text-green-400">
            {formatCurrency(amount)}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Racer receives (80%)</span>
            <span className="text-green-400">{formatCurrency(Math.round(amount * 0.8))}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee (20%)</span>
            <span>{formatCurrency(Math.round(amount * 0.2))}</span>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">
          Card Information
        </label>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe • Your payment info is encrypted</span>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Pay {formatCurrency(amount)}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">{props.description}</h3>
          <button
            onClick={props.onCancel}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </div>
    </div>
  );
};