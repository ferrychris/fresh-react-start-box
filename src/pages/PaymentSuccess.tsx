import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Heart, Star, Users } from 'lucide-react';
import { supabase, notifications } from '../lib/supabase';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  
  // Use useRef to prevent duplicate executions
  const isProcessingRef = useRef(false);
  const processedSessionsRef = useRef<Set<string>>(new Set());

  const sessionId = searchParams.get('session_id');
  const racerName = searchParams.get('racer');
  const tierName = searchParams.get('tier');

  useEffect(() => {
    // Load already processed sessions from localStorage
    const processedSessions = JSON.parse(localStorage.getItem('processedPaymentSessions') || '[]');
    processedSessionsRef.current = new Set(processedSessions);
    
    // Only run once when component mounts
    if (sessionId && !isProcessingRef.current && !processedSessionsRef.current.has(sessionId)) {
      handlePaymentSuccess();
    }
  }, []); // Empty dependency array to run only once

  const handlePaymentSuccess = async () => {
    // Prevent multiple executions
    if (isProcessingRef.current) {
      console.log('⏭️ Payment processing already in progress, skipping...');
      return;
    }

    // Check if this session has already been processed
    if (sessionId && processedSessionsRef.current.has(sessionId)) {
      console.log('⏭️ Payment session already processed, skipping...');
      setSuccess(true);
      setLoading(false);
      return;
    }

    isProcessingRef.current = true;
    
    try {
      console.log('🎉 Payment success page loaded');
      console.log('📋 Success parameters:', { sessionId, racerName, tierName });

      // Get pending subscription data from localStorage
      const pendingData = localStorage.getItem('pendingSubscriptionSuccess');
      if (pendingData) {
        const parsedData = JSON.parse(pendingData);
        console.log("🚀 ~ handlePaymentSuccess ~ parsedData:", parsedData)
        console.log('📋 Pending subscription data:', parsedData);
        setSubscriptionData(parsedData);

        // Clear the pending data
        localStorage.removeItem('pendingSubscriptionSuccess');

        // Handle the success action
        if (parsedData.onSuccessAction === 'refresh_fan_data') {
          console.log('🔄 Refreshing fan data...');
          // You can add logic here to refresh fan data if needed
        }
      }

      // Save subscription to database
      if (sessionId && racerName && tierName) {
        try {
          console.log('💾 Saving subscription to database...');
          
          // Get current user
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            throw new Error('User not authenticated');
          }

          // Get racer ID from the subscription data or find by name
          let racerId = subscriptionData?.racerId;
          if (!racerId) {
            // Find racer by name if racerId not provided
            const { data: racerProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('name', racerName)
              .eq('user_type', 'racer')
              .single();
            
            if (racerProfile) {
              racerId = racerProfile.id;
            } else {
              throw new Error('Racer not found');
            }
          }

          // Get subscription tier details
          console.log('🔍 Looking for tier:', { racerId, tierName });
          
          const { data: tierData, error: tierError } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('racer_id', racerId)
            .eq('tier_name', tierName)
            .eq('is_active', true);

          if (tierError) {
            console.error('❌ Error fetching tier:', tierError);
            throw new Error(`Error fetching tier: ${tierError.message}`);
          }

          console.log('📊 Found tiers:', tierData);

          if (!tierData || tierData.length === 0) {
            // Let's check what tiers actually exist for this racer
            const { data: allTiers } = await supabase
              .from('subscription_tiers')
              .select('tier_name, price_cents, is_active')
              .eq('racer_id', racerId);

            console.log('📋 All tiers for this racer:', allTiers);
            throw new Error(`Subscription tier '${tierName}' not found. Available tiers: ${allTiers?.map((t: any) => t.tier_name).join(', ')}`);
          }

          const tier = tierData[0]; // Use first match instead of single()
          console.log('✅ Found tier:', tier);

          // Calculate revenue split (80% to racer, 20% to platform)
          const totalAmountCents = tier.price_cents;
          const racerAmountCents = Math.floor(totalAmountCents * 0.8);
          const platformAmountCents = totalAmountCents - racerAmountCents;

          // Create transaction record
          const transactionData = {
            stripe_payment_intent_id: sessionId,
            transaction_type: 'subscription',
            payer_id: authUser.id,
            racer_id: racerId,
            total_amount_cents: totalAmountCents,
            racer_amount_cents: racerAmountCents,
            platform_amount_cents: platformAmountCents,
            subscription_tier_id: tier.id,
            stripe_customer_id: authUser.email, // You might want to get this from Stripe
            stripe_subscription_id: sessionId, // For now using session ID, you might want to get actual subscription ID
            status: 'completed',
            processed_at: new Date().toISOString(),
            metadata: {
              racer_name: racerName,
              tier_name: tierName,
              user_email: authUser.email
            }
          };

          console.log('📝 Creating transaction:', transactionData);

          // Check if transaction already exists
          const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('stripe_payment_intent_id', sessionId)
            .single();

          if (existingTransaction) {
            console.log('✅ Transaction already exists:', existingTransaction);
            // Continue with the rest of the process since transaction is already recorded
          } else {
            // Create new transaction
            const { data: transaction, error: transactionError } = await supabase
              .from('transactions')
              .insert([transactionData])
              .select()
              .single();

            if (transactionError) {
              console.error('❌ Transaction creation failed:', transactionError);
              
              // Check if it's a duplicate key error
              if (transactionError.code === '23505' && transactionError.message.includes('duplicate key')) {
                console.log('⚠️ Transaction already exists, continuing with existing transaction...');
                // Continue with the rest of the process since transaction is already recorded
              } else {
                throw new Error('Failed to create transaction record');
              }
            } else {
              console.log('✅ Transaction created:', transaction);
              
              // Mark this session as processed in localStorage
              if (sessionId) {
                processedSessionsRef.current.add(sessionId);
                localStorage.setItem('processedPaymentSessions', JSON.stringify(Array.from(processedSessionsRef.current)));
                console.log('✅ Session marked as processed in localStorage');
              }
            }
          }

          // Create or update fan connection (only if transaction is new)
          if (!existingTransaction) {
            const { data: existingConnection } = await supabase
              .from('fan_connections')
              .select('*')
              .eq('fan_id', authUser.id)
              .eq('racer_id', racerId)
              .single();

            if (existingConnection) {
              // Update existing connection
              const { error: updateError } = await supabase
                .from('fan_connections')
                .update({
                  is_subscribed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingConnection.id);

              if (updateError) {
                console.error('❌ Fan connection update failed:', updateError);
              } else {
                console.log('✅ Fan connection updated');
              }
            } else {
              // Create new fan connection
              const { error: connectionError } = await supabase
                .from('fan_connections')
                .insert([{
                  fan_id: authUser.id,
                  racer_id: racerId,
                  is_subscribed: true,
                  total_tips: 0,
                  is_superfan: false
                }]);

              if (connectionError) {
                console.error('❌ Fan connection creation failed:', connectionError);
              } else {
                console.log('✅ Fan connection created');
              }
            }
          } else {
            console.log('⏭️ Skipping fan connection update - transaction already exists');
          }

          // Update racer earnings (only if transaction is new)
          if (!existingTransaction) {
            const { data: existingEarnings } = await supabase
              .from('racer_earnings')
              .select('*')
              .eq('racer_id', racerId)
              .single();

            if (existingEarnings) {
              // Update existing earnings
              const { error: earningsError } = await supabase
                .from('racer_earnings')
                .update({
                  total_earnings_cents: existingEarnings.total_earnings_cents + racerAmountCents,
                  subscription_earnings_cents: existingEarnings.subscription_earnings_cents + racerAmountCents,
                  pending_payout_cents: existingEarnings.pending_payout_cents + racerAmountCents,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingEarnings.id);

              if (earningsError) {
                console.error('❌ Racer earnings update failed:', earningsError);
              } else {
                console.log('✅ Racer earnings updated');
              }
            } else {
              // Create new earnings record
              const { error: earningsError } = await supabase
                .from('racer_earnings')
                .insert([{
                  racer_id: racerId,
                  total_earnings_cents: racerAmountCents,
                  subscription_earnings_cents: racerAmountCents,
                  pending_payout_cents: racerAmountCents,
                  tip_earnings_cents: 0,
                  sponsorship_earnings_cents: 0,
                  total_paid_out_cents: 0
                }]);

              if (earningsError) {
                console.error('❌ Racer earnings creation failed:', earningsError);
              } else {
                console.log('✅ Racer earnings created');
              }
            }
          } else {
            console.log('⏭️ Skipping earnings update - transaction already exists');
          }

          console.log('✅ Subscription successfully saved to database');
          setSuccess(true);

        } catch (dbError) {
          console.error('❌ Database save failed:', dbError);
            
            // Create notification for racer about new super fan
            try {
              const { data: fanProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', authUser.id)
                .single();
              
              const fanName = fanProfile?.name || 'A fan';
              
              await notifications.createNotification(
                racerId,
                'new_superfan',
                '🎉 New Super Fan!',
                `${fanName} just subscribed to your ${tierName} tier!`,
                {
                  fan_id: authUser.id,
                  fan_name: fanName,
                  tier_name: tierName,
                  subscription_amount: tier.price_cents,
                  subscription_type: 'monthly'
                }
              );
              
              console.log('✅ Super fan notification created');
            } catch (notificationError) {
              console.error('⚠️ Failed to create super fan notification:', notificationError);
            }
          setError('Failed to save subscription to database. Please contact support.');
        }
      } else {
        console.log('⚠️ Missing required parameters for database save');
        setSuccess(true); // Still show success page even if we can't save to DB
      }

    } catch (error) {
      console.error('❌ Error handling payment success:', error);
      setError('An error occurred while processing your payment success.');
    } finally {
      setLoading(false);
      isProcessingRef.current = false; // Reset processing flag
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Processing your payment...</p>
        </div>
      </div>
    );
  }

  console.log("subscriptionData", subscriptionData);
  

  console.log("subscriptionData?.racerId", subscriptionData?.racerId);
  
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Payment Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-300">
            Welcome to the {tierName} tier!
          </p>
        </div>

        {/* Subscription Details */}
        <div className="bg-gray-900 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Subscription Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Racer:</span>
              <span className="text-white font-semibold">{racerName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Tier:</span>
              <span className="text-fedex-orange font-semibold">{tierName}</span>
            </div>
      
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 font-semibold flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-gray-900 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your {tierName} Benefits</h2>
          
          <div className="space-y-4">
            {tierName === 'Fan' && (
              <>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Exclusive behind-the-scenes content</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Early access to race updates</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Fan-only posts and stories</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Support your favorite racer</span>
                </div>
              </>
            )}
            
            {tierName === 'Supporter' && (
              <>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>All Fan tier benefits</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Monthly Q&A sessions</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Personalized thank you messages</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Priority comment responses</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Exclusive race day content</span>
                </div>
              </>
            )}
            
            {tierName === 'VIP' && (
              <>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>All Supporter tier benefits</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Private meet & greet opportunities</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Custom shoutout videos</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Exclusive merchandise discounts</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>Direct messaging access</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-fedex-orange mr-3" />
                  <span>VIP-only live streams</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* <Link
            to={`/racer/${subscriptionData?.racerId || ''}`}
            className="flex-1 px-6 py-4 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold text-center transition-colors flex items-center justify-center"
          >
            <Heart className="w-5 h-5 mr-2" />
            View Racer Profile
          </Link> */}
          
          <Link
            to="/feed"
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-center transition-colors flex items-center justify-center"
          >
            <Users className="w-5 h-5 mr-2" />
            Explore Feed
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>You will receive a confirmation email shortly.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@onlyracefans.com" className="text-fedex-orange hover:underline">
              support@onlyracefans.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}; 