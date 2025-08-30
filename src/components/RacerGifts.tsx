
import React, { useState, useEffect } from 'react';
import { Gift, Heart, Star, Crown } from 'lucide-react';
import { GiftTransaction, VirtualGift } from '../lib/supabase/types';

interface RacerGiftsProps {
  racerId: string;
  className?: string;
}

interface ExtendedGiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  token_amount: number;
  message?: string;
  created_at: string;
  is_public?: boolean;
  gift?: {
    name?: string;
    image_url?: string;
    token_cost?: number;
    emoji?: string;
    description?: string;
    rarity?: string;
  };
  sender?: { name?: string; avatar?: string };
}

export const RacerGifts: React.FC<RacerGiftsProps> = ({ racerId, className = '' }) => {
  const [gifts, setGifts] = useState<ExtendedGiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now since we don't have the actual API call
    const mockGifts: ExtendedGiftTransaction[] = [
      {
        id: '1',
        sender_id: 'fan1',
        receiver_id: racerId,
        gift_id: 'gift1',
        token_amount: 50,
        message: 'Great race!',
        created_at: new Date().toISOString(),
        gift: {
          name: 'Racing Trophy',
          emoji: '🏆',
          description: 'A golden trophy for excellent racing',
          token_cost: 50,
          rarity: 'rare'
        },
        sender: {
          name: 'Racing Fan',
          avatar: ''
        }
      }
    ];

    setGifts(mockGifts);
    setLoading(false);
  }, [racerId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No gifts received yet</p>
      </div>
    );
  }

  const getRarityIcon = (rarity?: string) => {
    switch (rarity) {
      case 'common': return <Heart className="h-4 w-4 text-gray-500" />;
      case 'rare': return <Star className="h-4 w-4 text-blue-500" />;
      case 'epic': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'legendary': return <Crown className="h-4 w-4 text-yellow-500" />;
      default: return <Gift className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center space-x-2">
        <Gift className="h-5 w-5" />
        <span>Recent Gifts</span>
      </h3>
      
      <div className="space-y-2">
        {gifts.map((gift) => (
          <div key={gift.id} className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3">
            <div className="text-2xl">{gift.gift?.emoji || '🎁'}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{gift.sender?.name || 'Anonymous'}</span>
                <span className="text-sm text-gray-500">sent</span>
                <span className="font-medium">{gift.gift?.name || 'Gift'}</span>
                {getRarityIcon(gift.gift?.rarity)}
              </div>
              {gift.message && (
                <p className="text-sm text-gray-600 mt-1">"{gift.message}"</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-purple-600">
                {gift.token_amount} tokens
              </div>
              <div className="text-xs text-gray-500">
                {new Date(gift.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RacerGifts;
