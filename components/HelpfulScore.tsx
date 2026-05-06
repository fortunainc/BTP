'use client';

import { ThumbsUp } from 'lucide-react';

interface HelpfulScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'highlighted';
}

export default function HelpfulScore({
  score,
  size = 'sm',
  showIcon = true,
  variant = 'default',
}: HelpfulScoreProps) {
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    default:
      'text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg',
    minimal: 'text-slate-400',
    highlighted:
      'text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg',
  };

  if (score === 0 && variant === 'minimal') {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center font-medium ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {showIcon && <ThumbsUp className={iconSizes[size]} />}
      <span>Helpful Score: {score}</span>
    </div>
  );
}