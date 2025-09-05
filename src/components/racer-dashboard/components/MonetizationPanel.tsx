import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface MonetizationPanelProps {
  userId: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  subscriberCount: number;
}

export const MonetizationPanel: React.FC<MonetizationPanelProps> = ({ userId }) => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutConnected, setPayoutConnected] = useState(false);

  useEffect(() => {
    const fetchMonetizationData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch subscription tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('subscription_tiers')
          .select('id, name, price_cents, subscriber_count')
          .eq('racer_id', userId)
          .order('price_cents', { ascending: true });
          
        if (tiersError) {
          console.error('Error fetching subscription tiers:', tiersError);
        } else if (tiersData) {
          const formattedTiers = tiersData.map(tier => ({
            id: tier.id,
            name: tier.name,
            price: tier.price_cents / 100, // Convert cents to dollars
            subscriberCount: tier.subscriber_count || 0
          }));
          setTiers(formattedTiers);
        }
        
        // Check if payout method is connected
        const { data: payoutData, error: payoutError } = await supabase
          .from('racer_payout_methods')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1);
          
        if (payoutError) {
          console.error('Error checking payout status:', payoutError);
        } else {
          setPayoutConnected(payoutData && payoutData.length > 0);
        }
      } catch (error) {
        console.error('Error in fetchMonetizationData:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMonetizationData();
  }, [userId]);

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <h3 className="text-xl font-bold text-white mb-4">Monetization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h4 className="font-bold text-white">Subscription Tiers</h4>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : tiers.length > 0 ? (
            <div className="mt-3 space-y-2">
              {tiers.map(tier => (
                <div key={tier.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">{tier.name}</span>
                  <div className="flex items-center">
                    <span className="text-green-400 font-medium mr-2">${tier.price.toFixed(2)}</span>
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
                      {tier.subscriberCount} subs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm mt-2">No subscription tiers set up yet</p>
          )}
          
          <button className="mt-3 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
            Manage Tiers
          </button>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h4 className="font-bold text-white">Payout Settings</h4>
          <div className="mt-2">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${payoutConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-slate-300 text-sm">
                {payoutConnected ? 'Payout method connected' : 'No payout method connected'}
              </p>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {payoutConnected 
                ? 'You will receive payouts on the 1st of each month' 
                : 'Connect a payout method to receive your earnings'}
            </p>
          </div>
          <button className="mt-3 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
            {payoutConnected ? 'Update Settings' : 'Connect Payout Method'}
          </button>
        </div>
      </div>
    </div>
  );
};
