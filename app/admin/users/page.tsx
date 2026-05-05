'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type User = {
  id: string;
  anonymousHandle: string;
  email: string;
  userRole: string;
  verificationStatus: string;
  verificationMethod: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isActive: boolean;
  _count: {
    jobPostings: number;
    applications: number;
    messages: number;
  };
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(
      currentStatus 
        ? 'Suspend this user? They will lose access to the platform.' 
        : 'Reactivate this user?'
    )) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update user status');
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getVerificationBadge = (status: string) => {
    const styles = {
      'Approved': 'bg-green-500/20 text-green-500',
      'Pending': 'bg-yellow-500/20 text-yellow-500',
      'Rejected': 'bg-red-500/20 text-red-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      'organization': 'bg-purple-500/20 text-purple-500',
      'operator': 'bg-blue-500/20 text-blue-500',
      'admin': 'bg-red-500/20 text-red-500',
    };
    return styles[role as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

  const filteredUsers = users.filter((u) => {
    if (filter === 'active' && !u.isActive) return false;
    if (filter === 'suspended' && u.isActive) return false;
    if (
      searchTerm &&
      !u.anonymousHandle.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
          <h1 className="text-3xl font-bold">User Oversight</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and access</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <div className="text-3xl font-bold">{users.length}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <div className="text-3xl font-bold text-green-500">
              {users.filter((u) => u.isActive).length}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Suspended Users</h3>
            <div className="text-3xl font-bold text-red-500">
              {users.filter((u) => !u.isActive).length}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Verified Users</h3>
            <div className="text-3xl font-bold text-blue-500">
              {users.filter((u) => u.verificationStatus === 'Approved').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'suspended'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  filter === status ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by handle or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Users List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Verification</th>
                <th className="text-left p-4">Activity</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold">{u.anonymousHandle}</div>
                        <div className="text-sm text-gray-400">{u.email}</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.userRole)}`}>
                        {u.userRole}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationBadge(u.verificationStatus)}`}>
                        {u.verificationStatus}
                      </span>
                      {u.verificationMethod && (
                        <div className="text-xs text-gray-500 mt-1">
                          {u.verificationMethod}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        <p>Jobs: {u._count.jobPostings}</p>
                        <p>Applications: {u._count.applications}</p>
                        <p>Messages: {u._count.messages}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleUserStatus(u.id, u.isActive)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          u.isActive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {u.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}