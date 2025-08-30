import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Gift, 
  Star, 
  Crown, 
  Zap, 
  X,
  ShoppingCart,
  Sparkles,
  Loader
} from 'lucide-react';
import { 
  getUserTokens, 
  getVirtualGifts,
  TOKEN_PACKAGES,
  type UserTokens,
  type VirtualGift 
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useApp } from '../App';

interface TokenStoreProps {
  onClose: () => void;
}

// Extend the package type locally to reflect optional bonus on items
type TokenPackage = (typeof TOKEN_PACKAGES)[number] & { bonus?: number };

export const TokenStore: React.FC<TokenStoreProps> = ({ onClose }) => {
  const { user } = useApp();
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [activeTab, setActiveTab] = useState<'buy' | 'gifts'>('buy');
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.error('Error loading token store data:', error);
    } finally {
      // loading state suppressed to avoid unused var lint
    }
  };

  const handlePurchaseTokens = async (packageData: TokenPackage, packageIndex: number) => {
    if (!user) {
      alert('Please sign in to purchase tokens');
      return;
    }

    setProcessingPayment(packageIndex);
    try {
      // Create a Stripe Checkout Session via Supabase Edge Function (mode: 'payment')
      const bonus = packageData.bonus ?? 0;
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'payment',
          // packageData.price is defined in cents in TOKEN_PACKAGES
          amountCents: packageData.price,
          user_id: user.id,
          customerEmail: user.email,
          description: `${packageData.tokens + bonus} Racing Tokens`,
          type: 'tokens',
          tokenCount: packageData.tokens + bonus,
          currency: 'usd',
          success_url: `${window.location.origin}/token/payment/success?session_id={CHECKOUT_SESSION_ID}&tokens=${packageData.tokens + bonus}&package_type=tokens`,
          cancel_url: `${window.location.origin}/payment/cancel`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment session');
      }

      const url = data?.url;
      if (!url) throw new Error('Missing checkout URL');

      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600';
      case 'rare': return 'text-blue-400 border-blue-600';
      case 'epic': return 'text-purple-400 border-purple-600';
      case 'legendary': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
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

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Sign In Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to buy tokens and send gifts.</p>
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Racing Token Store</h2>
                <p className="text-gray-400">Buy tokens to send gifts to your favorite racers</p>
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
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">Your Balance:</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {userTokens?.token_balance || 0} tokens
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'buy'
                ? 'bg-fedex-orange text-white border-b-2 border-fedex-orange'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ShoppingCart className="inline h-4 w-4 mr-2" />
            Buy Tokens
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'gifts'
                ? 'bg-fedex-orange text-white border-b-2 border-fedex-orange'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Gift className="inline h-4 w-4 mr-2" />
            Virtual Gifts
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'buy' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Choose Your Token Package</h3>
                <p className="text-gray-400">Tokens never expire and can be used to send gifts to any racer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOKEN_PACKAGES.map((pkg, index) => (
                  <div
                    key={index}
                    className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 ${
                      pkg.popular 
                        ? 'border-fedex-orange bg-fedex-orange/10' 
                        : 'border-gray-600 hover:border-fedex-orange bg-gray-800'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-fedex-orange text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          POPULAR
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Coins className="h-8 w-8 text-white" />
                      </div>
                      
                      <div className="text-2xl font-bold text-white mb-1">
                        {pkg.tokens.toLocaleString()}
                      </div>
                      
                      {((pkg as TokenPackage).bonus || 0) > 0 && (
                        <div className="text-green-400 font-semibold mb-2">
                          +{(pkg as TokenPackage).bonus} bonus tokens!
                        </div>
                      )}
                      
                      <div className="text-3xl font-bold text-fedex-orange mb-4">
                        ${pkg.price}
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-4">
                        {((pkg.price / (pkg.tokens + ((pkg as TokenPackage).bonus || 0))) * 100).toFixed(1)}¢ per token
                      </div>
                      
                      <button 
                        onClick={() => handlePurchaseTokens(pkg, index)}
                        disabled={processingPayment === index}
                        className="w-full px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2"
                      >
                        {processingPayment === index ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Buy Now</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Token Benefits */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="font-semibold text-white mb-3">Why Buy Tokens?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-fedex-orange" />
                    <span>Send virtual gifts to racers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-fedex-orange" />
                    <span>Show appreciation and support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-fedex-orange" />
                    <span>Unlock rare and legendary gifts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-fedex-orange" />
                    <span>Tokens never expire</span>
                  </div>
                </div>
              </div>

              {/* Payment Security Notice */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-medium">Secure Payment</span>
                </div>
                <p className="text-sm text-gray-300">
                  All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gifts' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Virtual Gift Gallery</h3>
                <p className="text-gray-400">Send these awesome gifts to show your support!</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gifts.map(gift => (
                  <div
                    key={gift.id}
                     className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${getRarityColor(gift.rarity || 'common')} ${getRarityGlow(gift.rarity || 'common')}`}
                   >
                     <div className="text-4xl mb-2">{gift.emoji || '🎁'}</div>
                     <h4 className="font-semibold text-white mb-1">{gift.name || 'Unknown Gift'}</h4>
                     <p className="text-xs text-gray-400 mb-3">{gift.description || 'A special gift'}</p>
                     
                     <div className="flex items-center justify-center space-x-1 mb-2">
                       <Coins className="h-4 w-4 text-yellow-400" />
                       <span className="font-bold text-yellow-400">{gift.token_cost || 0}</span>
                     </div>
                     
                     <div className={`text-xs font-semibold uppercase ${getRarityColor(gift.rarity || 'common').split(' ')[0]}`}>
                       {gift.rarity || 'common'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Rarity Legend */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Gift Rarity Guide</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-400">Common (10-25 tokens)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-400">Rare (50-100 tokens)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-400">Epic (100-200 tokens)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400">Legendary (300+ tokens)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};