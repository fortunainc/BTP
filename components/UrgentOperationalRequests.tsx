'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Briefcase, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface UrgentRequest {
  id: string;
  title: string;
  requiredRole: string;
  location: string;
  priorityLevel: string;
  createdAt: string;
  therapeuticArea: string;
}

interface UrgentOperationalRequestsProps {
  className?: string;
}

export default function UrgentOperationalRequests({
  className = '',
}: UrgentOperationalRequestsProps) {
  const [requests, setRequests] = useState<UrgentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrgentRequests() {
      try {
        const response = await fetch('/api/job-postings/urgent');
        if (response.ok) {
          const data = await response.json();
          setRequests(data.postings || []);
        }
      } catch (error) {
        console.error('Error fetching urgent requests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUrgentRequests();
  }, []);

  if (loading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-amber-700/50 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Urgent Operational Requests</h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <Link
            key={request.id}
            href={`/opportunities/${request.id}`}
            className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors border-l-4 border-amber-500"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {request.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {request.requiredRole}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.location || 'Remote'}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  request.priorityLevel === 'Critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {request.priorityLevel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{request.therapeuticArea}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Posted {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}