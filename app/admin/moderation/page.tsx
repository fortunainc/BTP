'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type FlaggedContent = {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  status: string;
  flaggedBy: {
    anonymousHandle: string;
  };
  createdAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  details: any;
  createdAt: string;
  user: {
    anonymousHandle: string;
  };
};

export default function AdminModerationPage() {
  if (!hasClerkKeys) {
    return <ClerkFallback />;
  }

  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'flagged' | 'audit'>('flagged');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [isAdmin, router]);

  const fetchData = async () => {
    try {
      const [flaggedRes, auditRes] = await Promise.all([
        fetch('/api/admin/flagged-content'),
        fetch('/api/admin/audit-logs?limit=50'),
      ]);

      if (flaggedRes.ok) {
        const flaggedData = await flaggedRes.json();
        setFlaggedContent(flaggedData.flaggedContent || []);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.auditLogs || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissFlag = async (flagId: string) => {
    if (!confirm('Dismiss this flagged content?')) return;

    try {
      const response = await fetch(`/api/admin/flagged-content/${flagId}/dismiss`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to dismiss flag');
      await fetchData();
    } catch (error) {
      console.error('Error dismissing flag:', error);
    }
  };

  const handleRemoveContent = async (flagId: string, contentId: string, contentType: string) => {
    if (!confirm('Remove this content? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/flagged-content/${flagId}/remove`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to remove content');
      await fetchData();
    } catch (error) {
      console.error('Error removing content:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-500/20 text-yellow-500',
      Dismissed: 'bg-gray-500/20 text-gray-500',
      Removed: 'bg-red-500/20 text-red-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

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
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage flagged content and view audit logs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'flagged' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Flagged Content ({flaggedContent.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'audit' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* Flagged Content Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-4">
            {flaggedContent.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No flagged content
              </div>
            ) : (
              flaggedContent.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(flag.status)}`}>
                          {flag.status}
                        </span>
                        <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">
                          {flag.contentType}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        Reason: {flag.reason}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Flagged by: {flag.flaggedBy.anonymousHandle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(flag.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {flag.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveContent(flag.id, flag.contentId, flag.contentType)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Remove Content
                        </button>
                        <button
                          onClick={() => handleDismissFlag(flag.id)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No audit logs
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{log.action}</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded text-xs">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        User: {log.user.anonymousHandle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.details && (
                        <pre className="mt-2 text-xs text-gray-500 bg-gray-900 p-2 rounded overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}