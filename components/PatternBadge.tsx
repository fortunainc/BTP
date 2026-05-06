'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface PatternBadgeProps {
  contributionId: string;
}

export default function PatternBadge({ contributionId }: PatternBadgeProps) {
  const [hasPattern, setHasPattern] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns();
  }, [contributionId]);

  const fetchPatterns = async () => {
    try {
      const response = await fetch(`/api/situations/${contributionId}/patterns`);
      if (response.ok) {
        const data = await response.json();
        setHasPattern(data.patterns && data.patterns.length > 0);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasPattern) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 border border-slate-600">
      <Activity className="w-3 h-3" />
      Pattern
    </span>
  );
}