'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Zap, Briefcase, X } from 'lucide-react';

interface BehavioralSignal {
  type: 'validation' | 'impact' | 'opportunity';
  message: string;
  timestamp: Date;
}

export default function BehavioralSignals() {
  const [signals, setSignals] = useState<BehavioralSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/operator/behavioral-signals');
      if (response.ok) {
        const data = await response.json();
        setSignals(data.signals || []);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSignal = (message: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(message);
    setDismissed(newDismissed);
  };

  const visibleSignals = signals.filter(s => !dismissed.has(s.message));

  if (loading || visibleSignals.length === 0) {
    return null;
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'validation':
        return <CheckCircle className="w-5 h-5 text-slate-400" />;
      case 'impact':
        return <Zap className="w-5 h-5 text-slate-400" />;
      case 'opportunity':
        return <Briefcase className="w-5 h-5 text-slate-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="space-y-2">
        {visibleSignals.map((signal, index) => (
          <div
            key={`${signal.message}-${index}`}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSignalIcon(signal.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {signal.message}
                </p>
              </div>
              <button
                onClick={() => dismissSignal(signal.message)}
                className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}