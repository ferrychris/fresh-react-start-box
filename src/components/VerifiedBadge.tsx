import React from 'react';
import { Check, CheckCircle, Crown, Star, Trophy, Zap } from 'lucide-react';

export interface BadgeProps {
  type?: 'verified' | 'featured' | 'champion' | 'rising' | 'pro';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const badgeConfig = {
  verified: {
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Verified Racer',
    description: 'Profile complete with 10+ followers'
  },
  featured: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Featured Racer',
    description: 'Highlighted by OnlyRaceFans'
  },
  champion: {
    icon: Trophy,
    color: 'text-gold-500',
    bgColor: 'bg-yellow-600/10',
    borderColor: 'border-yellow-600/20',
    label: 'Champion',
    description: 'Championship winner'
  },
  rising: {
    icon: Zap,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Rising Star',
    description: 'Fast-growing racer'
  },
  pro: {
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    label: 'Pro Racer',
    description: 'Professional racing status'
  }
};

const sizeConfig = {
  sm: {
    iconSize: 'w-3 h-3',
    padding: 'p-1',
    text: 'text-xs'
  },
  md: {
    iconSize: 'w-4 h-4',
    padding: 'p-1.5',
    text: 'text-sm'
  },
  lg: {
    iconSize: 'w-5 h-5',
    padding: 'p-2',
    text: 'text-base'
  }
};

export const VerifiedBadge: React.FC<BadgeProps> = ({ 
  type = 'verified', 
  size = 'md', 
  className = '',
  showTooltip = false 
}) => {
  const badge = badgeConfig[type];
  const sizeStyles = sizeConfig[size];
  const IconComponent = badge.icon;

  // Special rendering for 'verified' to mimic Facebook-style: solid blue circle with white check.
  if (type === 'verified') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-blue-500 ${sizeStyles.padding} ${className} transition-all duration-200 hover:scale-110`}
        title={showTooltip ? `${badge.label}: ${badge.description}` : undefined}
      >
        <Check className={`${sizeStyles.iconSize} text-white`} />
      </div>
    );
  }

  const badgeElement = (
    <div 
      className={`
        inline-flex items-center justify-center rounded-full
        ${badge.bgColor} ${badge.borderColor} border
        ${sizeStyles.padding} ${className}
        transition-all duration-200 hover:scale-110
      `}
      title={showTooltip ? `${badge.label}: ${badge.description}` : undefined}
    >
      <IconComponent className={`${sizeStyles.iconSize} ${badge.color}`} />
    </div>
  );

  return badgeElement;
};

// Utility function to determine which badges a racer should have
export const getRacerBadges = (racer: {
  is_verified?: boolean;
  is_featured?: boolean;
  championships?: number;
  career_wins?: number;
  years_racing?: number;
  follower_count?: number;
}): BadgeProps['type'][] => {
  const badges: BadgeProps['type'][] = [];

  // Verified badge - based on database is_verified flag
  if (racer.is_verified) {
    badges.push('verified');
  }

  // Featured badge - based on is_featured flag
  if (racer.is_featured) {
    badges.push('featured');
  }

  // Champion badge - has championships
  if (racer.championships && racer.championships > 0) {
    badges.push('champion');
  }

  // Pro badge - experienced racer with wins
  if (racer.years_racing && racer.years_racing >= 5 && racer.career_wins && racer.career_wins >= 10) {
    badges.push('pro');
  }

  // Rising star - newer racer with good performance
  if (racer.years_racing && racer.years_racing <= 3 && racer.career_wins && racer.career_wins >= 5) {
    badges.push('rising');
  }

  return badges;
};

// Component to display multiple badges
export const RacerBadges: React.FC<{
  racer: {
    is_verified?: boolean;
    is_featured?: boolean;
    championships?: number;
    career_wins?: number;
    years_racing?: number;
    follower_count?: number;
  };
  size?: BadgeProps['size'];
  maxBadges?: number;
  className?: string;
}> = ({ racer, size = 'md', maxBadges = 3, className = '' }) => {
  const badges = getRacerBadges(racer);
  const displayBadges = badges.slice(0, maxBadges);

  if (displayBadges.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {displayBadges.map((badgeType, index) => (
        <VerifiedBadge 
          key={`${badgeType}-${index}`}
          type={badgeType} 
          size={size}
        />
      ))}
    </div>
  );
};