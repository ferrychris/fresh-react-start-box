import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../App';
import { tokens as supabaseTokens } from '../lib/supabase';

export const TokenPaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAmount, setTokenAmount] = useState<number>(0);

  const sessionId = searchParams.get('session_id');
  const tokens = searchParams.get('tokens');
  const packageType = searchParams.get('package_type');

  useEffect(() => {
    if (sessionId && user) {
      handleTokenPurchaseSuccess();
    } else {
      setLoading(false);
      setError('Missing session information');
    }
  }, [sessionId, user]);

  const handleTokenPurchaseSuccess = async () => {
    if (!sessionId || !user || !tokens) {
      setError('Missing required information');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tokenAmountNum = parseInt(tokens);

      await supabaseTokens.processTokenPurchase(user.id, sessionId, tokenAmountNum);

      setTokenAmount(tokenAmountNum);
      setSuccess(true);

    } catch (error) {
      console.error('Error processing token purchase:', error);
      setError('Failed to add tokens to your account. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing Your Purchase</h2>
          <p className="text-gray-400">Adding tokens to your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Purchase Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Purchase Successful!</h1>
          
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Coins className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">+{tokenAmount.toLocaleString()}</span>
            </div>
            <p className="text-white font-medium">Racing Tokens Added</p>
            <p className="text-gray-400 text-sm">Your tokens are ready to use!</p>
          </div>

          <div className="space-y-4">
            <Link
              to="/racers"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Send Gifts to Racers
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              Return to Home
            </Link>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-white mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Browse racers and find your favorites</li>
              <li>• Send virtual gifts to show support</li>
              <li>• Unlock rare and legendary gifts</li>
              <li>• Tokens never expire!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 