'use client';

import { Shield } from 'lucide-react';

interface UserBadgesProps {
  isFoundingOperator?: boolean;
  badges?: string[];
  size?: 'sm' | 'md' | 'lg';
}

export default function UserBadges({
  isFoundingOperator = false,
  badges = [],
  size = 'sm',
}: UserBadgesProps) {
  if (!isFoundingOperator && badges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {isFoundingOperator && (
        <div
          className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses[size]}`}
          style={{
            backgroundColor: '#F5A623',
            color: '#0F1115',
          }}
        >
          <Shield className={iconSizes[size]} />
          <span>Founding Operator</span>
        </div>
      )}

      {badges.map((badge) => (
        <div
          key={badge}
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-slate-700 text-slate-300 ${sizeClasses[size]}`}
        >
          <span>{badge}</span>
        </div>
      ))}
    </div>
  );
}