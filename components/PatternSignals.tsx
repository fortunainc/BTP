'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface PatternSignalsProps {
  contributionId: string;
}

export default function PatternSignals({ contributionId }: PatternSignalsProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns();
  }, [contributionId]);

  const fetchPatterns = async () => {
    try {
      const response = await fetch(`/api/situations/${contributionId}/patterns`);
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || patterns.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Pattern detected</h3>
      </div>
      <div className="space-y-1">
        {patterns.map((pattern, index) => (
          <p key={index} className="text-sm text-slate-400">
            {pattern}
          </p>
        ))}
      </div>
    </div>
  );
}