import React, { useState } from 'react';
import { 
  DollarSign, 
  Heart, 
  X, 
  CreditCard, 
  Gift,
  Target,
  Calendar,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StripeCheckout } from './StripeCheckout';
import { useApp } from '../App';

interface PurseBuilderModalProps {
  trackId: string;
  trackName: string;
  onClose: () => void;
  onDonationComplete?: () => void;
}

export const PurseBuilderModal: React.FC<PurseBuilderModalProps> = ({
  trackId,
  trackName,
  onClose,
  onDonationComplete
}) => {
  const { user } = useApp();
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('general');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState(1);

  const suggestedAmounts = [10, 25, 50, 100, 250, 500];
  
  const donationPurposes = [
    { 
      id: 'general', 
      name: 'General Track Support', 
      description: 'Help with overall track operations and maintenance',
      icon: () => <div className="w-6 h-6">🔧</div>,
      color: 'text-blue-400'
    },
    { 
      id: 'purse', 
      name: 'Race Purse Enhancement', 
      description: 'Increase prize money for upcoming races',
      icon: Trophy,
      color: 'text-yellow-400'
    },
    { 
      id: 'improvements', 
      name: 'Track Improvements', 
      description: 'Fund facility upgrades and safety enhancements',
      icon: () => <div className="w-6 h-6">🎯</div>,
      color: 'text-green-400'
    },
    { 
      id: 'events', 
      name: 'Special Events', 
      description: 'Support special racing events and championships',
      icon: Calendar,
      color: 'text-purple-400'
    }
  ];

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const selectedPurpose = donationPurposes.find(p => p.id === donationPurpose);

  const handleDonate = () => {
    if (finalAmount < 5) {
      alert('Minimum donation amount is $5');
      return;
    }
    setShowCheckout(true);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (showCheckout) {
    return (
      <StripeCheckout
        type="tip"
        amount={finalAmount * 100}
        racerId={trackId}
        userId={user?.id || 'anonymous'}
        userEmail={user?.email || ''}
        userName={user?.name || 'Anonymous Donor'}
        description={`Donation to ${trackName} - ${selectedPurpose?.name}`}
        onSuccess={() => {
          setShowCheckout(false);
          onDonationComplete?.();
          onClose();
        }}
        onCancel={() => setShowCheckout(false)}
        metadata={{
          track_name: trackName,
          donation_purpose: donationPurpose,
          donation_message: message,
          is_anonymous: isAnonymous,
          donation_type: 'track_support'
        }}
      />
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Support {trackName}</h3>
          <p className="text-gray-400 mb-6">
            You can donate to support the track without creating an account, or sign in for a personalized experience.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCheckout(true)}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            >
              Donate as Guest
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Purse Builder</h2>
                <p className="text-gray-400">Support {trackName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= step ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`w-8 h-1 rounded-full ${
                    i < step ? 'bg-green-600' : 'bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center mt-2 text-sm text-gray-400">
            Step {step}: {step === 1 ? 'Choose Purpose' : step === 2 ? 'Select Amount' : 'Add Message'}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Choose Purpose */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">How would you like to help?</h3>
                <p className="text-gray-400">Choose what your donation will support</p>
              </div>

              <div className="space-y-3">
                {donationPurposes.map(purpose => {
                  const Icon = purpose.icon;
                  return (
                    <div
                      key={purpose.id}
                      onClick={() => setDonationPurpose(purpose.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        donationPurpose === purpose.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${purpose.color}`} />
                        <div>
                          <h4 className="font-semibold text-white">{purpose.name}</h4>
                          <p className="text-sm text-gray-400">{purpose.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Select Amount */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Choose Your Donation Amount</h3>
                <p className="text-gray-400">Every dollar helps keep the track running strong</p>
              </div>

              {/* Suggested Amounts */}
              <div className="grid grid-cols-3 gap-3">
                {suggestedAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`p-4 rounded-lg font-semibold transition-all ${
                      selectedAmount === amount && !customAmount
                        ? 'bg-green-600 text-white scale-105'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(0);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter custom amount"
                    min="5"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Impact Description */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Your ${finalAmount} donation will help:</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  {finalAmount >= 500 && (
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span>Significantly boost race purses for multiple events</span>
                    </div>
                  )}
                  {finalAmount >= 100 && (
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-400" />
                      <span>Fund major track improvements and safety upgrades</span>
                    </div>
                  )}
                  {finalAmount >= 50 && (
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4 text-blue-400" />
                      <span>Cover essential maintenance and equipment costs</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span>Support upcoming racing events and activities</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={finalAmount < 5}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Message & Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Add a Message (Optional)</h3>
                <p className="text-gray-400">Leave an encouraging message for the track</p>
              </div>

              {/* Donation Summary */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Donation Amount</span>
                  <span className="text-2xl font-bold text-green-400">${finalAmount}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Supporting</span>
                  <span className="text-white font-semibold">{selectedPurpose?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Track</span>
                  <span className="text-white font-semibold">{trackName}</span>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message to Track (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Keep up the great work! Thanks for providing awesome racing..."
                  maxLength={200}
                />
                <div className="text-xs text-gray-400 mt-1">{message.length}/200 characters</div>
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                />
                <label className="text-white">Make this donation anonymous</label>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-blue-300 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Your donation is secure and will be processed through Stripe. You'll receive a receipt via email.</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDonate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <Heart className="h-4 w-4" />
                  <span>Donate ${finalAmount}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};