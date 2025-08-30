import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowLeft, Coins } from 'lucide-react';

export const PaymentCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
        <p className="text-gray-400 mb-6">
          Your token purchase was cancelled. No charges were made to your account.
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            <Coins className="h-4 w-4 mr-2" />
            Try Again
          </Link>
          
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Home
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Need Help?</h3>
          <p className="text-sm text-gray-400">
            If you're having trouble with your purchase, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}; 