'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Clock, DollarSign, User, ArrowRight, MessageCircle, MapPin } from 'lucide-react';
import HelpfulScore from '@/components/HelpfulScore';
import UserBadges from '@/components/UserBadges';

interface WorkMatch {
  id: string;
  status: string;
  message: string;
  proposedRate: string | null;
  createdAt: string;
  workRequest: {
    id: string;
    title: string;
    category: string;
    hourlyRate: string | null;
    location: string | null;
    requester: {
      id: string;
      anonymousHandle: string;
      operatorTier: string;
      helpfulScore?: number;
      isFoundingOperator?: boolean;
    };
  };
  operator: {
    id: string;
    anonymousHandle: string;
    operatorTier: string;
    helpfulScore?: number;
    isFoundingOperator?: boolean;
    therapeuticAreas: string[];
    hourlyRate: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<WorkMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [filterStatus]);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/work-matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filterStatus && match.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Matches</h1>
          <p className="text-gray-600">
            Track your applications and work opportunities
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Matches</p>
            <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {matches.filter(m => m.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Accepted</p>
            <p className="text-3xl font-bold text-green-600">
              {matches.filter(m => m.status === 'Accepted').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-blue-600">
              {matches.filter(m => m.status === 'Completed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <div className="flex gap-2">
              {['', 'Pending', 'Accepted', 'Rejected', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filterStatus ? `No ${filterStatus.toLowerCase()} matches found` : 'No matches yet'}
            </p>
            <Link
              href="/workforce"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Work Requests &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        href={`/workforce/requests/${match.workRequest.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {match.workRequest.title}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{match.workRequest.category}</p>

                    {/* Your Message */}
                    {match.message && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Your Message</span>
                        </div>
                        <p className="text-sm text-gray-700">{match.message}</p>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {match.proposedRate && (
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Your Rate</span>
                          </div>
                          <p className="font-semibold text-gray-900">{match.proposedRate}</p>
                        </div>
                      )}
                      {match.workRequest.hourlyRate && (
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Posted Rate</span>
                          </div>
                          <p className="font-semibold text-gray-900">{match.workRequest.hourlyRate}</p>
                        </div>
                      )}
                      {match.workRequest.location && (
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>Location</span>
                          </div>
                          <p className="font-semibold text-gray-900">{match.workRequest.location}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>Applied</span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {new Date(match.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Connection Info */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Connected with {match.workRequest.requester.anonymousHandle}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {match.workRequest.requester.operatorTier}
                        </span>
                        <HelpfulScore score={match.workRequest.requester.helpfulScore || 0} size="sm" variant="minimal" />
                        <UserBadges isFoundingOperator={match.workRequest.requester.isFoundingOperator || false} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/workforce/requests/${match.workRequest.id}`}
                    className="ml-4 flex-shrink-0"
                  >
                    <button className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}