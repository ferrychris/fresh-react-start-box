import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Star,
  Users,
  Gift,
  Crown,
  Zap
} from 'lucide-react';

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedRevenue: number;
  category: 'pricing' | 'content' | 'engagement' | 'marketing';
  actionItems: string[];
  implemented?: boolean;
}

interface RevenueOptimizerProps {
  currentRevenue: number;
  fanCount: number;
  superFanCount: number;
  conversionRate: number;
  onImplementSuggestion?: (suggestionId: string) => void;
}

export const RevenueOptimizer: React.FC<RevenueOptimizerProps> = ({
  currentRevenue,
  fanCount,
  superFanCount,
  conversionRate,
  onImplementSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    generateSuggestions();
  }, [currentRevenue, fanCount, superFanCount, conversionRate]);

  const generateSuggestions = () => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // Pricing optimization
    if (conversionRate < 15) {
      newSuggestions.push({
        id: 'lower-entry-tier',
        title: 'Lower Entry Tier Price',
        description: 'Reduce your lowest tier price to increase conversion rate',
        impact: 'high',
        difficulty: 'easy',
        estimatedRevenue: Math.round(currentRevenue * 0.25),
        category: 'pricing',
        actionItems: [
          'Analyze competitor pricing',
          'Test $5-7 entry tier',
          'Monitor conversion rates',
          'Adjust based on results'
        ]
      });
    }

    // Content optimization
    if (fanCount > 100 && superFanCount / fanCount < 0.3) {
      newSuggestions.push({
        id: 'exclusive-content',
        title: 'Create Exclusive Content Tiers',
        description: 'Add premium content to convert more fans to super fans',
        impact: 'high',
        difficulty: 'medium',
        estimatedRevenue: Math.round(currentRevenue * 0.4),
        category: 'content',
        actionItems: [
          'Plan exclusive behind-the-scenes content',
          'Create VIP-only race footage',
          'Offer personal Q&A sessions',
          'Provide early access to announcements'
        ]
      });
    }

    // Engagement optimization
    if (fanCount > 50) {
      newSuggestions.push({
        id: 'live-streaming',
        title: 'Weekly Live Streams',
        description: 'Host regular live streams to boost engagement and tips',
        impact: 'medium',
        difficulty: 'medium',
        estimatedRevenue: 500,
        category: 'engagement',
        actionItems: [
          'Set up streaming equipment',
          'Schedule weekly time slots',
          'Promote streams in advance',
          'Enable live tipping features'
        ]
      });
    }

    // Marketing optimization
    newSuggestions.push({
      id: 'referral-program',
      title: 'Fan Referral Program',
      description: 'Reward fans for bringing in new supporters',
      impact: 'medium',
      difficulty: 'easy',
      estimatedRevenue: Math.round(fanCount * 15),
      category: 'marketing',
      actionItems: [
        'Design referral rewards system',
        'Create shareable referral links',
        'Offer incentives for both parties',
        'Track referral performance'
      ]
    });

    // Merchandise opportunity
    if (fanCount > 200) {
      newSuggestions.push({
        id: 'merchandise-store',
        title: 'Launch Merchandise Store',
        description: 'Sell branded merchandise to your fan base',
        impact: 'high',
        difficulty: 'hard',
        estimatedRevenue: Math.round(fanCount * 25),
        category: 'marketing',
        actionItems: [
          'Design branded merchandise',
          'Set up e-commerce platform',
          'Create product mockups',
          'Launch with limited edition items'
        ]
      });
    }

    setSuggestions(newSuggestions);
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-600/20';
      case 'medium': return 'text-yellow-400 bg-yellow-600/20';
      case 'low': return 'text-green-400 bg-green-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return DollarSign;
      case 'content': return Star;
      case 'engagement': return Users;
      case 'marketing': return Target;
      default: return Lightbulb;
    }
  };

  const totalPotentialRevenue = suggestions.reduce((sum, s) => sum + s.estimatedRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Revenue Optimizer</h2>
            <p className="text-gray-400">AI-powered suggestions to maximize your earnings</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Potential Additional Revenue</div>
            <div className="text-2xl font-bold text-green-400">
              +${totalPotentialRevenue.toLocaleString()}/month
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2">
          {['all', 'pricing', 'content', 'engagement', 'marketing'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-fedex-orange text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        {filteredSuggestions.map(suggestion => {
          const CategoryIcon = getCategoryIcon(suggestion.category);
          
          return (
            <div key={suggestion.id} className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <CategoryIcon className="h-6 w-6 text-fedex-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
                    <p className="text-gray-400 mb-3">{suggestion.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className={`px-2 py-1 rounded-full font-semibold ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact.toUpperCase()} IMPACT
                      </div>
                      <div className={`${getDifficultyColor(suggestion.difficulty)}`}>
                        {suggestion.difficulty.charAt(0).toUpperCase() + suggestion.difficulty.slice(1)} to implement
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    +${suggestion.estimatedRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">potential monthly</div>
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-white mb-3">Implementation Steps:</h4>
                <div className="space-y-2">
                  {suggestion.actionItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-fedex-orange/20 rounded-full flex items-center justify-center">
                        <span className="text-fedex-orange text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Lightbulb className="h-4 w-4" />
                  <span>Based on successful creators with similar metrics</span>
                </div>
                
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors">
                    Learn More
                  </button>
                  <button
                    onClick={() => onImplementSuggestion?.(suggestion.id)}
                    className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                  >
                    Implement Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Metrics */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Success Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">15%+</div>
            <div className="text-sm text-gray-400">Target Conversion Rate</div>
            <div className={`text-xs mt-1 ${conversionRate >= 15 ? 'text-green-400' : 'text-red-400'}`}>
              Current: {conversionRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">$50+</div>
            <div className="text-sm text-gray-400">Revenue per Fan</div>
            <div className={`text-xs mt-1 ${(currentRevenue / fanCount) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              Current: ${((currentRevenue / fanCount) / 100).toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">30%+</div>
            <div className="text-sm text-gray-400">Super Fan Ratio</div>
            <div className={`text-xs mt-1 ${(superFanCount / fanCount) >= 0.3 ? 'text-green-400' : 'text-red-400'}`}>
              Current: {((superFanCount / fanCount) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-fedex-orange mb-1">$2K+</div>
            <div className="text-sm text-gray-400">Monthly Target</div>
            <div className={`text-xs mt-1 ${currentRevenue >= 200000 ? 'text-green-400' : 'text-red-400'}`}>
              Current: ${(currentRevenue / 100).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      <div className="bg-gradient-to-r from-fedex-orange/20 to-red-500/20 border border-fedex-orange/30 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-fedex-orange" />
          <h3 className="text-lg font-semibold text-white">Quick Wins</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">🎯 Optimize Posting Schedule</h4>
            <p className="text-sm text-gray-300 mb-3">
              Post during peak fan activity (7-9 PM) to increase engagement by 35%
            </p>
            <button className="px-3 py-1 bg-fedex-orange hover:bg-fedex-orange-dark rounded text-sm font-semibold transition-colors">
              Set Reminders
            </button>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">💬 Engage More</h4>
            <p className="text-sm text-gray-300 mb-3">
              Respond to comments within 2 hours to boost fan loyalty by 50%
            </p>
            <button className="px-3 py-1 bg-fedex-orange hover:bg-fedex-orange-dark rounded text-sm font-semibold transition-colors">
              Enable Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};