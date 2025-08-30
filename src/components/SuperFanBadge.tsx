import React from 'react';
import { Crown, Star, Zap } from 'lucide-react';

interface SuperFanBadgeProps {
  type?: 'superfan' | 'top-fan' | 'fan';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const SuperFanBadge: React.FC<SuperFanBadgeProps> = ({
  type = 'fan',
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  };

  const badgeConfig = {
    superfan: {
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      borderColor: 'border-yellow-400/50',
      text: 'Super Fan',
      gradient: 'from-yellow-400 to-orange-500'
    },
    'top-fan': {
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/20',
      borderColor: 'border-purple-400/50',
      text: 'Top Fan',
      gradient: 'from-purple-400 to-pink-500'
    },
    fan: {
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      borderColor: 'border-blue-400/50',
      text: 'Fan',
      gradient: 'from-blue-400 to-cyan-500'
    }
  };

  const config = badgeConfig[type];
  const Icon = config.icon;

  if (!showText) {
    return (
      <div className={`
        inline-flex items-center justify-center rounded-full border
        ${config.bgColor} ${config.borderColor} ${sizeClasses[size]} ${className}
      `}>
        <Icon className={`${config.color} ${sizeClasses[size]}`} />
      </div>
    );
  }

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-semibold
      ${config.bgColor} ${config.borderColor} ${config.color} ${className}
    `}>
      <Icon className={sizeClasses[size]} />
      {showText && <span>{config.text}</span>}
    </div>
  );
};