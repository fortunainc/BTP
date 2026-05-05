'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type HireRecord = {
  id: string;
  hireDate: string;
  feePercentage: number;
  estimatedFee: number;
  feeRecord: {
    id: string;
    status: string;
    collectedAmount: number | null;
    invoicedAt: string | null;
    collectedAt: string | null;
  } | null;
  application: {
    id: string;
    proposedRate: number;
    jobPosting: {
      title: string;
      organization: {
        anonymousHandle: string;
      };
    };
    operator: {
      anonymousHandle: string;
    };
  };
};

export default function AdminHiringFeesPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [hires, setHires] = useState<HireRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Fee Pending' | 'Invoiced' | 'Collected' | 'Waived'>('all');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchHires();
  }, [isAdmin, router]);

  const fetchHires = async () => {
    try {
      const response = await fetch('/api/admin/hires');
      if (!response.ok) throw new Error('Failed to fetch hires');
      const data = await response.json();
      setHires(data.hires || []);
    } catch (error) {
      console.error('Error fetching hires:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeeStatus = async (feeRecordId: string, newStatus: string, amount?: number) => {
    try {
      const response = await fetch(`/api/admin/fee-records/${feeRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, amount }),
      });
      if (!response.ok) throw new Error('Failed to update fee status');
      await fetchHires();
    } catch (error) {
      console.error('Error updating fee status:', error);
    }
  };

  const getFeeStatusBadge = (status: string) => {
    const styles = {
      'Fee Pending': 'bg-yellow-500/20 text-yellow-500',
      'Invoiced': 'bg-blue-500/20 text-blue-500',
      'Collected': 'bg-green-500/20 text-green-500',
      'Waived': 'bg-gray-500/20 text-gray-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

  const filteredHires = hires.filter((hire) => {
    if (filter === 'all') return true;
    return hire.feeRecord?.status === filter;
  });

  const totalFeesCollected = hires
    .filter((h) => h.feeRecord?.status === 'Collected' && h.feeRecord.collectedAmount)
    .reduce((sum, h) => sum + (h.feeRecord!.collectedAmount || 0), 0);

  const totalPendingFees = hires
    .filter((h) => h.feeRecord?.status === 'Fee Pending')
    .reduce((sum, h) => sum + (h.estimatedFee || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Hiring & Fees Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor hires and platform fee collection</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Hires</h3>
            <div className="text-3xl font-bold text-blue-500">{hires.length}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Fees</h3>
            <div className="text-3xl font-bold text-yellow-500">
              ${totalPendingFees.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Collected Fees</h3>
            <div className="text-3xl font-bold text-green-500">
              ${totalFeesCollected.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'Fee Pending', 'Invoiced', 'Collected', 'Waived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        {/* Hires List */}
        <div className="space-y-4">
          {filteredHires.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No hires found
            </div>
          ) : (
            filteredHires.map((hire) => (
              <div
                key={hire.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6"
              >
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {hire.application.jobPosting.title}
                    </h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">Organization:</span>{' '}
                        {hire.application.jobPosting.organization.anonymousHandle}
                      </p>
                      <p>
                        <span className="font-medium">Operator:</span>{' '}
                        {hire.application.operator.anonymousHandle}
                      </p>
                      <p>
                        <span className="font-medium">Hire Date:</span>{' '}
                        {new Date(hire.hireDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Rate:</span> ${hire.application.proposedRate}/hr
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Fee Details</h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-400">Percentage:</span> {hire.feePercentage * 100}%
                        </p>
                        <p>
                          <span className="text-gray-400">Estimated Fee:</span> ${hire.estimatedFee?.toFixed(2)}
                        </p>
                        {hire.feeRecord && (
                          <>
                            <p>
                              <span className="text-gray-400">Status:</span>{' '}
                              <span className={`px-2 py-0.5 rounded text-xs ${getFeeStatusBadge(hire.feeRecord.status)}`}>
                                {hire.feeRecord.status}
                              </span>
                            </p>
                            {hire.feeRecord.collectedAmount && (
                              <p>
                                <span className="text-gray-400">Collected:</span> ${hire.feeRecord.collectedAmount.toFixed(2)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {hire.feeRecord && (
                  <div className="pt-4 border-t border-gray-700">
                    <h4 className="font-semibold mb-3">Actions</h4>
                    <div className="flex gap-2 flex-wrap">
                      {hire.feeRecord.status === 'Fee Pending' && (
                        <button
                          onClick={() => updateFeeStatus(hire.feeRecord!.id, 'Invoiced')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark as Invoiced
                        </button>
                      )}
                      {hire.feeRecord.status === 'Invoiced' && (
                        <button
                          onClick={() => {
                            const amount = prompt('Enter collected amount:');
                            if (amount) {
                              updateFeeStatus(hire.feeRecord!.id, 'Collected', parseFloat(amount));
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Record Collection
                        </button>
                      )}
                      {hire.feeRecord.status !== 'Collected' && hire.feeRecord.status !== 'Waived' && (
                        <button
                          onClick={() => updateFeeStatus(hire.feeRecord!.id, 'Waived')}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                        >
                          Waive Fee
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}