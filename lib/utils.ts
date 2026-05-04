import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function getReputationTierInfo(tier: string) {
  const tiers = {
    BRONZE: {
      name: 'Bronze',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300',
      range: '0-999 points',
    },
    SILVER: {
      name: 'Silver',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      range: '1,000-4,999 points',
    },
    GOLD: {
      name: 'Gold',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      range: '5,000-14,999 points',
    },
    PLATINUM: {
      name: 'Platinum',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300',
      range: '15,000+ points',
    },
  };

  return tiers[tier as keyof typeof tiers] || tiers.BRONZE;
}

export function calculateReputationTier(score: number): string {
  if (score >= 15000) return 'PLATINUM';
  if (score >= 5000) return 'GOLD';
  if (score >= 1000) return 'SILVER';
  return 'BRONZE';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}