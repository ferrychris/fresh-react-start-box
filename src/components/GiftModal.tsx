import React, { useState, useEffect } from 'react';
import { Gift, Coins, Heart, X, Send, Sparkles } from 'lucide-react';
import { 
  getUserTokens, 
  getVirtualGifts, 
  gifts as supabaseGifts,
} from '../lib/supabase';
import type { UserTokens, VirtualGift } from '../lib/supabase/types';
import { useApp } from '../App';

interface GiftModalProps {
  racerId: string;
  racerName: string;
  onClose: () => void;
  onGiftSent?: (giftName: string, giftEmoji: string, tokenCost: number) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  racerId,
  racerName,
  onClose,
  onGiftSent
}) => {
  const { user } = useApp();
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [tokensData, giftsData] = await Promise.all([
        getUserTokens(user.id),
        getVirtualGifts()
      ]);
      
      setUserTokens(tokensData);
      setGifts(giftsData);
    } catch (error) {
      console.error('Error loading gift data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!user || !selectedGift) return;
    
    // Handle both VirtualGift format and raw data format
    const tokenCost = selectedGift.token_cost || selectedGift.token_amount || 0;
    
    if (!userTokens || userTokens.token_balance < tokenCost) {
      alert('Not enough tokens! Please buy more tokens first.');
      return;
    }

    setSending(true);
    try {
      // Calculate 80/20 split for gift revenue
      const totalTokens = tokenCost;
      const racerTokens = Math.floor(totalTokens * 0.8); // 80% to racer
      const platformTokens = totalTokens - racerTokens; // 20% to platform
      
      console.log('Gift revenue split:', {
        total: totalTokens,
        racer: racerTokens,
        platform: platformTokens
      });
      
      await supabaseGifts.sendVirtualGift(user.id, racerId, selectedGift.id, message.trim() || undefined);
      
      // Refresh token balance
      const updatedTokens = await getUserTokens(user.id);
      setUserTokens(updatedTokens);
      
      if (onGiftSent) {
        onGiftSent(selectedGift.name, selectedGift.emoji, selectedGift.token_cost);
      }
      onClose();
      
      alert(`🎁 ${selectedGift.name} sent to ${racerName}!`);
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-600 bg-gray-800';
      case 'rare': return 'border-blue-600 bg-blue-600/10';
      case 'epic': return 'border-purple-600 bg-purple-600/10';
      case 'legendary': return 'border-yellow-600 bg-yellow-600/10';
      default: return 'border-gray-600 bg-gray-800';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'shadow-lg shadow-blue-500/20';
      case 'epic': return 'shadow-lg shadow-purple-500/20';
      case 'legendary': return 'shadow-lg shadow-yellow-500/20 animate-pulse';
      default: return '';
    }
  };

  const canAfford = (gift: VirtualGift) => {
    return userTokens && userTokens.token_balance >= gift.token_cost;
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Sign In Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to send gifts to racers.</p>
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Send Gift to {racerName}</h2>
                <p className="text-gray-400 text-sm">Show your support with a virtual gift</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Token Balance */}
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-yellow-400" />
                <span className="text-white text-sm">Your Balance:</span>
              </div>
              <div className="text-lg font-bold text-yellow-400">
                {userTokens?.token_balance || 0} tokens
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Gift Selection */}
          <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading gifts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {gifts.map(gift => (
                <div
                  key={gift.id}
                  onClick={() => canAfford(gift) && setSelectedGift(gift)}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all cursor-pointer touch-manipulation ${
                    selectedGift?.id === gift.id
                      ? 'border-orange-500 bg-orange-500/10 scale-105'
                      : canAfford(gift)
                      ? `${getRarityColor(gift.rarity)} hover:scale-105`
                      : 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
                  } ${getRarityGlow(gift.rarity)}`}
                >
                  <div className="text-3xl mb-2">{gift.emoji}</div>
                  <h4 className="font-semibold text-white text-sm mb-1">{gift.name}</h4>
                  
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Coins className="h-3 w-3 text-yellow-400" />
                    <span className={`text-sm font-bold ${canAfford(gift) ? 'text-yellow-400' : 'text-red-400'}`}>
                      {gift.token_cost}
                    </span>
                  </div>
                  
                  <div className={`text-xs font-semibold uppercase ${
                    gift.rarity === 'common' ? 'text-gray-400' :
                    gift.rarity === 'rare' ? 'text-blue-400' :
                    gift.rarity === 'epic' ? 'text-purple-400' : 'text-yellow-400'
                  }`}>
                    {gift.rarity}
                  </div>
                  
                  {!canAfford(gift) && (
                    <div className="text-xs text-red-400 mt-1">Not enough tokens</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message and Send */}
        {selectedGift && (
            <div className="px-6 pb-6 border-t border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder={`Great race! Keep it up! 🏁`}
                  maxLength={200}
                />
                <div className="text-xs text-gray-400 mt-1">{message.length}/200 characters</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{selectedGift.emoji}</div>
                  <div>
                    <div className="font-semibold text-white">{selectedGift.name}</div>
                    <div className="text-sm text-gray-400">{selectedGift.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Coins className="h-4 w-4 text-yellow-400" />
                    <span className="font-bold text-yellow-400">{selectedGift.token_cost}</span>
                  </div>
                  <div className="text-xs text-gray-400">tokens</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedGift(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Choose Different Gift
                </button>
                <button
                  onClick={handleSendGift}
                  disabled={sending || !canAfford(selectedGift)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Gift</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No tokens CTA */}
        {userTokens && userTokens.token_balance === 0 && (
            <div className="px-6 pb-6 border-t border-gray-700 bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h4 className="font-semibold text-white mb-2">No tokens yet?</h4>
              <p className="text-gray-400 text-sm mb-4">Buy tokens to send awesome gifts to racers!</p>
              <button
                onClick={() => {
                  onClose();
                  // Open token store
                }}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold text-white transition-colors"
              >
                Buy Tokens
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
