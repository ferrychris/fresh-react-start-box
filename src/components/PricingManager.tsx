import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Star,
  Car,
  Users,
  Calendar
} from 'lucide-react';
import { 
  createSubscriptionTier, 
  updateSubscriptionTier, 
  getRacerSubscriptionTiers,
  createSponsorshipPackage,
  updateSponsorshipPackage,
  getRacerSponsorshipPackages,
  type SubscriptionTier,
  type SponsorshipPackage
} from '../lib/supabase';
import { createStripePrice } from '../lib/stripe';

interface PricingManagerProps {
  racerId: string;
  onUpdate?: () => void;
}

export const PricingManager: React.FC<PricingManagerProps> = ({ racerId, onUpdate }) => {
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [sponsorshipPackages, setSponsorshipPackages] = useState<SponsorshipPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'sponsorships'>('subscriptions');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [subscriptionForm, setSubscriptionForm] = useState({
    tier_name: '',
    price_cents: 0,
    description: '',
    benefits: ['']
  });

  const [sponsorshipForm, setSponsorshipForm] = useState({
    package_name: '',
    price_cents: 0,
    description: '',
    duration_races: 1,
    car_placement: '',
    benefits: ['']
  });

  useEffect(() => {
    loadData();
  }, [racerId]);

  const loadData = async () => {
    try {
      const [tiers, packages] = await Promise.all([
        getRacerSubscriptionTiers(racerId),
        getRacerSponsorshipPackages(racerId)
      ]);
      setSubscriptionTiers(tiers);
      setSponsorshipPackages(packages);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    }
  };

  const handleAddSubscriptionTier = async () => {
    if (!subscriptionForm.tier_name || subscriptionForm.price_cents <= 0) {
      alert('Please enter a tier name and price greater than $0');
      return;
    }

    setLoading(true);
    try {
      // Create Stripe price for recurring subscription
      const stripePrice = await createStripePrice(
        'prod_subscription', // You'll need to create a product in Stripe
        subscriptionForm.price_cents,
        'month'
      );

      await createSubscriptionTier({
        racer_id: racerId,
        tier_name: subscriptionForm.tier_name,
        price_cents: subscriptionForm.price_cents,
        description: subscriptionForm.description,
        benefits: subscriptionForm.benefits.filter(b => b.trim()),
        is_active: true,
        stripe_price_id: stripePrice.price_id
      });

      setSubscriptionForm({
        tier_name: '',
        price_cents: 0,
        description: '',
        benefits: ['']
      });
      setShowAddForm(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating subscription tier:', error);
      alert('Failed to create subscription tier');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsorshipPackage = async () => {
    if (!sponsorshipForm.package_name || sponsorshipForm.price_cents <= 0) return;

    setLoading(true);
    try {
      // Create Stripe price for one-time sponsorship payment
      const stripePrice = await createStripePrice(
        'prod_sponsorship', // You'll need to create a product in Stripe
        sponsorshipForm.price_cents
        // No interval = one-time payment
      );

      await createSponsorshipPackage({
        racer_id: racerId,
        package_name: sponsorshipForm.package_name,
        price_cents: sponsorshipForm.price_cents,
        description: sponsorshipForm.description,
        duration_races: sponsorshipForm.duration_races,
        car_placement: sponsorshipForm.car_placement,
        benefits: sponsorshipForm.benefits.filter(b => b.trim()),
        is_active: true,
        stripe_price_id: stripePrice.price_id
      });

      setSponsorshipForm({
        package_name: '',
        price_cents: 0,
        description: '',
        duration_races: 1,
        car_placement: '',
        benefits: ['']
      });
      setShowAddForm(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating sponsorship package:', error);
      alert('Failed to create sponsorship package');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const carPlacements = [
    'Hood', 'Door Panels', 'Rear Spoiler', 'Front Bumper', 
    'Quarter Panel', 'Roof', 'Side Skirts', 'Rear Bumper'
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-xl font-bold">Pricing Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 md:px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors flex items-center space-x-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          <span>Add {activeTab === 'subscriptions' ? 'Tier' : 'Package'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2 px-2 md:px-4 rounded-md font-medium transition-all text-sm md:text-base ${
            activeTab === 'subscriptions'
              ? 'bg-fedex-orange text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Users className="inline h-4 w-4 mr-1 md:mr-2" />
          Subscription Tiers
        </button>
        <button
          onClick={() => setActiveTab('sponsorships')}
          className={`flex-1 py-2 px-2 md:px-4 rounded-md font-medium transition-all text-sm md:text-base ${
            activeTab === 'sponsorships'
              ? 'bg-fedex-orange text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Car className="inline h-4 w-4 mr-1 md:mr-2" />
          Sponsorship Packages
        </button>
      </div>

      {/* Subscription Tiers */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {subscriptionTiers.map(tier => (
            <div key={tier.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{tier.tier_name}</h4>
                  <div className="text-2xl font-bold text-green-400">
                    {formatPrice(tier.price_cents)}/month
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingItem(tier.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {tier.description && (
                <p className="text-gray-300 mb-3">{tier.description}</p>
              )}
              
              <div className="space-y-1">
                {tier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Star className="h-3 w-3 text-fedex-orange" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                <div className="flex items-center justify-between">
                  <span>You earn: {formatPrice(Math.floor(tier.price_cents * 0.8))}/month</span>
                  <span>Platform fee: {formatPrice(Math.floor(tier.price_cents * 0.2))}/month</span>
                </div>
              </div>
            </div>
          ))}
          
          {subscriptionTiers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subscription tiers yet. Create your first tier to start earning!</p>
            </div>
          )}
        </div>
      )}

      {/* Sponsorship Packages */}
      {activeTab === 'sponsorships' && (
        <div className="space-y-4">
          {sponsorshipPackages.map(pkg => (
            <div key={pkg.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{pkg.package_name}</h4>
                  <div className="text-2xl font-bold text-green-400">
                    {formatPrice(pkg.price_cents)}
                    <span className="text-sm text-gray-400">
                      /{pkg.duration_races} race{pkg.duration_races > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    <Car className="inline h-3 w-3 mr-1" />
                    {pkg.car_placement}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingItem(pkg.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {pkg.description && (
                <p className="text-gray-300 mb-3">{pkg.description}</p>
              )}
              
              <div className="space-y-1">
                {pkg.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Star className="h-3 w-3 text-fedex-orange" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                <div className="flex items-center justify-between">
                  <span>You earn: {formatPrice(Math.floor(pkg.price_cents * 0.8))}</span>
                  <span>Platform fee: {formatPrice(Math.floor(pkg.price_cents * 0.2))}</span>
                </div>
              </div>
            </div>
          ))}
          
          {sponsorshipPackages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No sponsorship packages yet. Create packages to attract sponsors!</p>
            </div>
          )}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add {activeTab === 'subscriptions' ? 'Subscription Tier' : 'Sponsorship Package'}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeTab === 'subscriptions' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tier Name</label>
                  <input
                    type="text"
                    value={subscriptionForm.tier_name}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, tier_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="e.g., Fan, Supporter, VIP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={subscriptionForm.price_cents / 100}
                      onChange={(e) => setSubscriptionForm(prev => ({ ...prev, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="5.00"
                      step="0.01"
                      min="1.00"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll earn: ${((subscriptionForm.price_cents * 0.8) / 100).toFixed(2)}/month (80% of total)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={subscriptionForm.description}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={2}
                    placeholder="What subscribers get..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Benefits</label>
                  {subscriptionForm.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => {
                          const newBenefits = [...subscriptionForm.benefits];
                          newBenefits[index] = e.target.value;
                          setSubscriptionForm(prev => ({ ...prev, benefits: newBenefits }));
                        }}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Benefit description"
                      />
                      {index === subscriptionForm.benefits.length - 1 && (
                        <button
                          onClick={() => setSubscriptionForm(prev => ({ ...prev, benefits: [...prev.benefits, ''] }))}
                          className="p-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleAddSubscriptionTier}
                  disabled={loading || !subscriptionForm.tier_name || subscriptionForm.price_cents <= 0}
                  className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Subscription Tier'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Package Name</label>
                  <input
                    type="text"
                    value={sponsorshipForm.package_name}
                    onChange={(e) => setSponsorshipForm(prev => ({ ...prev, package_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="e.g., Hood Sponsorship, Door Panel Package"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={sponsorshipForm.price_cents / 100}
                      onChange={(e) => setSponsorshipForm(prev => ({ ...prev, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="500.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll earn: ${((sponsorshipForm.price_cents * 0.8) / 100).toFixed(2)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Car Placement</label>
                    <select
                      value={sponsorshipForm.car_placement}
                      onChange={(e) => setSponsorshipForm(prev => ({ ...prev, car_placement: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="">Select placement</option>
                      {carPlacements.map(placement => (
                        <option key={placement} value={placement}>{placement}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (Races)</label>
                    <input
                      type="number"
                      value={sponsorshipForm.duration_races}
                      onChange={(e) => setSponsorshipForm(prev => ({ ...prev, duration_races: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      min="1"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleAddSponsorshipPackage}
                  disabled={loading || !sponsorshipForm.package_name || sponsorshipForm.price_cents <= 0}
                  className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Sponsorship Package'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};