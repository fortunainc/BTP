'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import Link from 'next/link';

interface TrendingSignal {
  category: string;
  threadCount: number;
  replyCount: number;
  helpfulVotes: number;
  recentActivity: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendingExecutionSignalsProps {
  className?: string;
}

export default function TrendingExecutionSignals({ className = '' }: TrendingExecutionSignalsProps) {
  const [signals, setSignals] = useState<TrendingSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingSignals() {
      try {
        const response = await fetch('/api/threads/trending-signals');
        if (response.ok) {
          const data = await response.json();
          setSignals(data.signals || []);
        }
      } catch (error) {
        console.error('Error fetching trending signals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingSignals();
  }, []);

  if (loading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Trending Execution Signals</h3>
      </div>

      <div className="space-y-3">
        {signals.map((signal, index) => (
          <Link
            key={signal.category}
            href={`/threads?category=${encodeURIComponent(signal.category)}`}
            className="block bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {index + 1}. {signal.category}
              </span>
              {signal.trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {signal.threadCount} threads
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {signal.helpfulVotes} helpful
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {signal.recentActivity} recent
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}