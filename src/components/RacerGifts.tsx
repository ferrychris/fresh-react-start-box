import React, { useState, useEffect } from 'react';
import { Gift, Coins, Heart, Clock, User, Sparkles } from 'lucide-react';
import { getRacerGifts, type GiftTransaction } from '../lib/supabase';

interface RacerGiftsProps {
  racerId: string;
  className?: string;
}

export const RacerGifts: React.FC<RacerGiftsProps> = ({ racerId, className = '' }) => {
  const [gifts, setGifts] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGifts();
  }, [racerId]);

  const loadGifts = async () => {
    try {
      const giftData = await getRacerGifts(racerId);
      setGifts(giftData);
    } catch (error) {
      console.error('Error loading racer gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const totalTokensReceived = gifts.reduce((sum, gift) => sum + gift.token_amount, 0);
  const uniqueGifters = new Set(gifts.map(g => g.sender_id)).size;

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Gift className="h-5 w-5 mr-2 text-pink-500" />
          Recent Gifts
        </h3>
        {gifts.length > 0 && (
          <div className="text-sm text-gray-400">
            {totalTokensReceived} tokens from {uniqueGifters} fans
          </div>
        )}
      </div>

      {gifts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-gray-600" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">No gifts yet</h4>
          <p className="text-gray-400 text-sm">
            Fans can send you virtual gifts using tokens to show their support!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {gifts.map(gift => (
            <div key={gift.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl">{gift.gift?.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-white text-sm">
                    {gift.sender?.name || 'Anonymous Fan'}
                  </span>
                  <span className="text-xs text-gray-400">sent</span>
                  <span className={`font-semibold text-sm ${getRarityColor(gift.gift?.rarity || 'common')}`}>
                    {gift.gift?.name}
                  </span>
                </div>
                
                {gift.message && (
                  <p className="text-sm text-gray-300 mb-2 italic">"{gift.message}"</p>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Coins className="h-3 w-3 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{gift.token_amount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(gift.created_at)}</span>
                    </div>
                  </div>
                  
                  {gift.gift?.rarity !== 'common' && (
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                      gift.gift?.rarity === 'rare' ? 'bg-blue-600/20 text-blue-400' :
                      gift.gift?.rarity === 'epic' ? 'bg-purple-600/20 text-purple-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {gift.gift?.rarity}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gift Stats */}
      {gifts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-pink-400">{gifts.length}</div>
              <div className="text-gray-400">Total Gifts</div>
            </div>
            <div>
              <div className="font-bold text-yellow-400">{totalTokensReceived}</div>
              <div className="text-gray-400">Tokens Received</div>
            </div>
            <div>
              <div className="font-bold text-blue-400">{uniqueGifters}</div>
              <div className="text-gray-400">Unique Gifters</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};