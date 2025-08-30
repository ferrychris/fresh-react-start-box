import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, DollarSign, Clock } from 'lucide-react';
import { getRacerEarnings } from '../lib/supabase';
import { createConnectAccount } from '../lib/stripe';
import { useApp } from '../App';
import { primaryButton, outlineButton } from '../styles/buttons';

interface ConnectAccountSetupProps {
  racerId: string;
  onSetupComplete?: () => void;
}

export const ConnectAccountSetup: React.FC<ConnectAccountSetupProps> = ({
  racerId,
  onSetupComplete
}) => {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'none' | 'pending' | 'active'>('none');
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);

  useEffect(() => {
    checkAccountStatus();
  }, [racerId]);

  const checkAccountStatus = async () => {
    try {
      const earningsData = await getRacerEarnings(racerId);
      setEarnings(earningsData);
      
      if (earningsData?.stripe_account_id) {
        setAccountStatus('active');
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };

  const handleSetupAccount = async () => {
    if (!user?.email) {
      alert('User email is required to set up payout account.');
      return;
    }

    setLoading(true);
    try {
      console.log('Setting up Connect account for:', { racerId, email: user.email });
      
      // Check if Supabase URL is available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }
      
      console.log('Making request to:', `${supabaseUrl}/functions/v1/create-connect-account`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-connect-account`, {
        method: 'POST',
        headers: {
          // Authorization header with anon key removed per request to avoid exposing token in client headers
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          racer_id: racerId,
          email: user.email
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          const errorText = await response.text();
          console.error('Failed to parse error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
        }
        console.error('Connect account setup failed:', errorData);
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: Failed to set up payout account`);
      }

      const result = await response.json();
      console.log('Connect account setup result:', result);
      
      setOnboardingUrl(result.onboarding_url);
      setAccountStatus('pending');
      
      // Open Stripe onboarding in new window
      if (result.onboarding_url) {
        window.open(result.onboarding_url, '_blank');
      }
      
      onSetupComplete?.();
    } catch (error) {
      console.error('Error setting up Connect account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to set up payout account: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (accountStatus === 'active') {
    return (
      <div className="bg-green-600/20 border border-green-600/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Payout Account Active</h3>
            <p className="text-green-300">You're all set to receive payments!</p>
          </div>
        </div>
        
        {earnings && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Total Earnings</div>
              <div className="text-xl font-bold text-green-400">
                ${(earnings.total_earnings_cents / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Pending Payout</div>
              <div className="text-xl font-bold text-yellow-400">
                ${(earnings.pending_payout_cents / 100).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (accountStatus === 'pending') {
    return (
      <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-8 w-8 text-yellow-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Account Setup In Progress</h3>
            <p className="text-yellow-300">Complete your Stripe onboarding to start receiving payments</p>
          </div>
        </div>
        
        {onboardingUrl && (
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${outlineButton} inline-flex items-center space-x-2`}
          >
            <span>Continue Setup</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <DollarSign className="h-8 w-8 text-fedex-orange" />
        <div>
          <h3 className="text-lg font-semibold text-white">Set Up Payouts</h3>
          <p className="text-gray-400">Connect your bank account to receive payments from fans</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">What you'll get:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 80% of all fan payments</li>
            <li>• Weekly automatic payouts</li>
            <li>• Secure bank transfers</li>
            <li>• Tax reporting (1099 forms)</li>
            <li>• Real-time earnings tracking</li>
          </ul>
        </div>
        
        <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-300 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Powered by Stripe Connect - Bank-level security & compliance</span>
          </div>
        </div>
        
        <button
          onClick={handleSetupAccount}
          disabled={loading}
          className={`${primaryButton} w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Setting up...</span>
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4" />
              <span>Set Up Payout Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};