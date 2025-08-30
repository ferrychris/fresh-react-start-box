
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElement } from '@stripe/stripe-js';
import { calculateRevenueSplit, createTransaction } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface StripePaymentProps {
  amount: number;
  payerId: string;
  receiverId: string;
  type: 'tip' | 'subscription' | 'sponsorship';
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  payerId,
  receiverId,
  type,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe.js has not loaded yet.');
      return;
    }

    if (!amount || amount <= 0) {
      onError('Invalid amount.');
      return;
    }

    try {
      setProcessing(true);
      
      // Calculate revenue split
      const revenueSplitData = await calculateRevenueSplit(amount);
      const racerAmount = revenueSplitData?.racer_amount || Math.floor(amount * 0.8);
      const platformAmount = revenueSplitData?.platform_amount || Math.floor(amount * 0.2);

      const cardElement = elements.getElement(CardElement) as StripeCardElement;
      if (!cardElement) {
        onError('Card element not found.');
        setProcessing(false);
        return;
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        onError(error.message || 'Payment method creation failed.');
        setProcessing(false);
        return;
      }

      const { error: paymentError } = await stripe.confirmCardPayment(
        paymentMethod.id,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        onError(paymentError.message || 'Payment confirmation failed.');
        setProcessing(false);
        return;
      }

      // Create transaction record
      await createTransaction({
        payer_id: payerId,
        receiver_id: receiverId,
        total_amount_cents: amount,
        racer_amount_cents: racerAmount,
        platform_amount_cents: platformAmount,
        transaction_type: type,
        status: 'completed',
        stripe_payment_intent_id: 'mock_payment_id'
      });

      onSuccess();
      alert('Payment successful!');
      setProcessing(false);
      
      const finalRevenueSplitData = await calculateRevenueSplit(amount);
      const finalRacerAmount = finalRevenueSplitData?.racer_amount || racerAmount;
      const finalPlatformAmount = finalRevenueSplitData?.platform_amount || platformAmount;

      console.log('Payment completed successfully!', {
        totalAmount: amount,
        racerAmount: finalRacerAmount,
        platformAmount: finalPlatformAmount,
      });
    } catch (error) {
      console.error('Payment failed:', error);
      onError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div>
      <CardElement />
      <button onClick={handlePayment} disabled={processing || !stripe}>
        {processing ? 'Processing...' : `Pay $${amount / 100}`}
      </button>
    </div>
  );
};
