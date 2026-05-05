'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

// Check if Clerk keys are available
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Force dynamic rendering to avoid static generation errors with Clerk
export const dynamic = 'force-dynamic';

type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';
type UserWithProfile = {
  id: string;
  anonymousHandle: string;
  email: string;
  userRole: string;
  verificationStatus: VerificationStatus;
  verificationMethod: string | null;
  verifiedEmail: string | null;
  linkedinUrl: string | null;
  roleCategory: string | null;
  companyType: string | null;
  createdAt: string;
};

export default function AdminVerificationsPage() {
  if (!hasClerkKeys) {
    return <ClerkFallback />;
  }

  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserWithProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/verifications');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setPendingUsers(data.pending || []);
      setAllUsers(data.all || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve user');
      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (!response.ok) throw new Error('Failed to reject user');
      await fetchUsers();
      setSelectedUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = (activeTab === 'pending' ? pendingUsers : allUsers).filter(
    (u) =>
      u.anonymousHandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Verification Management</h1>
            <p className="text-gray-400 mt-1">Review and approve user accounts</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">
              {pendingUsers.length} Pending
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'pending' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Pending ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            All Users ({allUsers.length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by handle or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* User List */}
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No users found
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">{u.anonymousHandle || 'No handle'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        u.verificationStatus === 'Approved' ? 'bg-green-500/20 text-green-500' :
                        u.verificationStatus === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {u.verificationStatus}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                        {u.userRole}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <p>Email: {u.email}</p>
                      {u.verifiedEmail && <p>Verified Email: {u.verifiedEmail}</p>}
                      {u.linkedinUrl && (
                        <p>
                          LinkedIn: 
                          <a href={u.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                            {u.linkedinUrl}
                          </a>
                        </p>
                      )}
                      <p>Role: {u.roleCategory || u.companyType || 'Not specified'}</p>
                      <p className="text-xs mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.verificationStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rejection Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Reject User</h2>
              <p className="text-gray-400 mb-4">
                Please provide a reason for rejecting {selectedUser.anonymousHandle}'s account.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none h-24 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedUser.id)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback component for when Clerk is not configured
function ClerkFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Authentication Configuration Required</h1>
        <p className="text-slate-400">
          Authentication is currently being configured. Please check back later or contact the administrator.
        </p>
      </div>
    </div>
  );
}