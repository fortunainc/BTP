/**
 * EXECUTION SIGNALS - Pattern Pulse
 * 
 * Shows live signals about what's happening in the community:
 * - "Enrollment issues rising this week"
 * - "Protocol deviations trending in oncology"
 * - "Site overload patterns increasing"
 * 
 * Updates dynamically, aggregates data (no raw exposure)
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Users } from 'lucide-react';

interface Signal {
  id: string;
  type: 'rising' | 'trending' | 'increasing' | 'stable';
  category: string;
  therapeuticArea?: string;
  description: string;
  change: number; // Percentage change
  period: string;
}

interface SignalMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

const MOCK_SIGNALS: Signal[] = [
  {
    id: '1',
    type: 'rising',
    category: 'Enrollment',
    description: 'Enrollment issues rising this week',
    change: 23,
    period: 'this week'
  },
  {
    id: '2',
    type: 'trending',
    category: 'Protocol Deviations',
    therapeuticArea: 'Oncology',
    description: 'Protocol deviations trending in oncology',
    change: 15,
    period: 'this week'
  },
  {
    id: '3',
    type: 'increasing',
    category: 'Site Overload',
    description: 'Site overload patterns increasing',
    change: 31,
    period: 'this month'
  },
  {
    id: '4',
    type: 'stable',
    category: 'Data Quality',
    therapeuticArea: 'Cardiology',
    description: 'Data quality issues stable in cardiology',
    change: 0,
    period: 'this week'
  }
];

const MOCK_METRICS: SignalMetric[] = [
  { label: 'Active Contributors', value: '47', trend: 'up' },
  { label: 'Issues Resolved This Week', value: '12', trend: 'up' },
  { label: 'Patterns Identified', value: '8', trend: 'stable' }
];

export default function ExecutionSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState<SignalMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      // In production, this would fetch real data
      // For now, use mock data
      setSignals(MOCK_SIGNALS);
      setMetrics(MOCK_METRICS);
    } catch (error) {
      console.error('Error fetching execution patterns:', error);
      setSignals(MOCK_SIGNALS);
      setMetrics(MOCK_METRICS);
    } finally {
      setLoading(false);
    }
  };

  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'increasing':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 20) return 'text-red-400';
    if (change > 0) return 'text-amber-400';
    return 'text-emerald-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cyan-500" />
        <h2 className="text-xl font-bold text-white">Execution Patterns</h2>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">{metric.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{metric.value}</span>
              {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Cards */}
      <div className="space-y-3">
        {signals.map((signal) => (
          <div 
            key={signal.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {getSignalIcon(signal.type)}
              <div>
                <p className="text-white text-sm">{signal.description}</p>
                <p className="text-slate-500 text-xs">{signal.period}</p>
              </div>
            </div>
            {signal.change > 0 && (
              <span className={`text-sm font-medium ${getChangeColor(signal.change)}`}>
                +{signal.change}%
              </span>
            )}
            {signal.change === 0 && (
              <span className="text-sm font-medium text-slate-500">stable</span>
            )}
          </div>
        ))}
      </div>

      {/* Community Pulse */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium">Community Pulse</span>
        </div>
        <p className="text-slate-300 text-sm">
          {metrics[0].value} operators actively sharing insights.{' '}
          {metrics[1].value} issues resolved this week.
        </p>
      </div>
    </div>
  );
}