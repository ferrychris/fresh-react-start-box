import React from 'react';
import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  size = 'md', 
  showText = true,
  className = ''
}) => {
  // Size mappings
  const sizeClasses = {
    sm: {
      container: 'gap-0.5 px-1 py-0.5 rounded-full text-[10px]',
      icon: 'w-2.5 h-2.5'
    },
    md: {
      container: 'gap-1 px-2 py-0.5 rounded-full text-xs',
      icon: 'w-3.5 h-3.5'
    },
    lg: {
      container: 'gap-1.5 px-2.5 py-1 rounded-full text-sm',
      icon: 'w-4 h-4'
    }
  };
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses[size].container} bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}
      title="Verified racer"
    >
      <CheckCircle className={sizeClasses[size].icon} />
      {showText && <span>Verified</span>}
    </span>
  );
};
