'use client';

/**
 * BTP Trust & Safety Investigation Panel
 * 
 * RESTRICTED ACCESS - Different from regular analytics
 * 
 * Requirements:
 * - Founder/admin only
 * - Reason required before accessing sensitive data
 * - All access logged
 * - Warning before exposing sensitive data
 * 
 * Use Cases:
 * - Abuse investigation
 * - Spam detection
 * - Legal issues
 * - Suspected deanonymization attacks
 * - Safety escalations
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const VALID_REASONS = [
  { value: 'abuse', label: 'Abuse', description: 'Harassment, threats, or abusive behavior' },
  { value: 'spam', label: 'Spam', description: 'Spam or promotional content' },
  { value: 'legal_issue', label: 'Legal Issue', description: 'Legal or compliance concerns' },
  { value: 'suspected_deanonymization_attack', label: 'Deanonymization Attack', description: 'Attempt to identify anonymous users' },
  { value: 'safety_escalation', label: 'Safety Escalation', description: 'Safety-related escalation' },
  { value: 'content_report', label: 'Content Report', description: 'Reported content requiring review' },
  { value: 'user_complaint', label: 'User Complaint', description: 'User-submitted complaint' },
  { value: 'security_incident', label: 'Security Incident', description: 'Security-related issue' },
];

type TabType = 'flagged' | 'investigations' | 'high_risk' | 'audit_logs';

interface FlaggedContent {
  flaggedItems: number;
  flaggedContributions: number;
  contributions: Array<{
    id: string;
    type: string;
    area: string;
    category: string;
    urgency: string;
    redactions: number;
    riskScore: number;
    flagReason: string | null;
    createdAt: string;
  }>;
  flaggedReports: Array<{
    id: string;
    contentType: string;
    contentId: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
}

interface Investigation {
  id: string;
  adminUserId: string;
  reason: string | null;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
}

interface HighRiskContent {
  highRiskContributions: Array<{
    id: string;
    type: string;
    area: string;
    riskScore: number;
    riskFactors: Record<string, unknown> | null;
    redactions: number;
    createdAt: string;
  }>;
  suspiciousUsers: Array<{
    id: string;
    handle: string;
    role: string;
    trustScore: number;
    isSuspended: boolean;
    suspensionReason: string | null;
    createdAt: string;
  }>;
}

interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  reason: string | null;
  targetType: string | null;
  targetId: string | null;
  fieldsAccessed: string[];
  createdAt: string;
}

export default function TrustSafetyPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('flagged');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent | null>(null);
  const [investigations, setInvestigations] = useState<{ investigations: Investigation[] } | null>(null);
  const [highRiskContent, setHighRiskContent] = useState<HighRiskContent | null>(null);
  const [auditLogs, setAuditLogs] = useState<{ logs: AuditLog[] } | null>(null);
  
  // Investigation form
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [investigationReason, setInvestigationReason] = useState('');
  const [investigationDetails, setInvestigationDetails] = useState('');
  const [targetType, setTargetType] = useState<'user' | 'contribution' | 'interaction' | 'message'>('user');
  const [targetId, setTargetId] = useState('');
  const [investigationResult, setInvestigationResult] = useState<Record<string, unknown> | null>(null);

  const fetchData = async (type: TabType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/trust-safety?action=${type}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      
      switch (type) {
        case 'flagged':
          setFlaggedContent(result.data);
          break;
        case 'investigations':
          setInvestigations(result.data);
          break;
        case 'high_risk':
          setHighRiskContent(result.data);
          break;
        case 'audit_logs':
          setAuditLogs(result.data);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    fetchData(tab);
  };

  const handleInvestigation = async () => {
    if (!investigationReason || !targetId) {
      setError('Reason and Target ID are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/trust-safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: investigationReason,
          reasonDetails: investigationDetails,
          targetType,
          targetId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Investigation failed');
      }
      
      const result = await response.json();
      setInvestigationResult(result);
      setShowInvestigationForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startInvestigation = (type: 'user' | 'contribution' | 'interaction' | 'message', id: string) => {
    setTargetType(type);
    setTargetId(id);
    setShowInvestigationForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Warning Banner */}
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">RESTRICTED AREA:</span>
            <span>All access is logged. Only use for legitimate safety investigations.</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Trust & Safety Investigation Panel</h1>
              <p className="text-sm text-gray-400">Reason required before accessing sensitive data</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/analytics"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
              >
                ← Analytics Dashboard
              </Link>
              <button
                onClick={() => {
                  setShowInvestigationForm(true);
                  setInvestigationResult(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
              >
                New Investigation
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'flagged', label: 'Flagged Content' },
            { id: 'high_risk', label: 'High Risk' },
            { id: 'investigations', label: 'Recent Investigations' },
            { id: 'audit_logs', label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Investigation Form Modal */}
        {showInvestigationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-medium text-white mb-4">Start Investigation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reason *</label>
                  <select
                    value={investigationReason}
                    onChange={(e) => setInvestigationReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Select a reason...</option>
                    {VALID_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Details</label>
                  <textarea
                    value={investigationDetails}
                    onChange={(e) => setInvestigationDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={3}
                    placeholder="Provide additional context..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Type *</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as typeof targetType)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="user">User</option>
                      <option value="contribution">Contribution</option>
                      <option value="interaction">Interaction</option>
                      <option value="message">Message</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target ID *</label>
                    <input
                      type="text"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="Enter ID..."
                    />
                  </div>
                </div>

                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                  <p className="text-sm text-yellow-200">
                    <strong>Warning:</strong> This action will be logged. You are about to access sensitive user data.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowInvestigationForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvestigation}
                  disabled={loading || !investigationReason || !targetId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Start Investigation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Investigation Result */}
        {investigationResult && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-red-600">
            <h3 className="text-lg font-medium text-white mb-4">Investigation Result</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(investigationResult, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => setInvestigationResult(null)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'flagged' && flaggedContent && (
              <FlaggedContentSection 
                data={flaggedContent} 
                onInvestigate={startInvestigation}
              />
            )}
            {activeTab === 'high_risk' && highRiskContent && (
              <HighRiskSection 
                data={highRiskContent} 
                onInvestigate={startInvestigation}
              />
            )}
            {activeTab === 'investigations' && investigations && (
              <InvestigationsSection data={investigations} />
            )}
            {activeTab === 'audit_logs' && auditLogs && (
              <AuditLogsSection data={auditLogs} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Flagged Content Section
function FlaggedContentSection({ 
  data, 
  onInvestigate 
}: { 
  data: FlaggedContent;
  onInvestigate: (type: 'user' | 'contribution' | 'interaction' | 'message', id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Flagged Items</p>
          <p className="text-2xl font-bold text-white">{data.flaggedItems}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Flagged Contributions</p>
          <p className="text-2xl font-bold text-white">{data.flaggedContributions}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">Flagged Contributions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Flag Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.contributions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{c.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.area}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{(c.riskScore * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.flagReason || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onInvestigate('contribution', c.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">Flagged Reports</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Content Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Content ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.flaggedReports.map((f) => (
                <tr key={f.id} className="hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-300">{f.contentType}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{f.contentId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{f.reason}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      f.status === 'Pending' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// High Risk Section
function HighRiskSection({ 
  data, 
  onInvestigate 
}: { 
  data: HighRiskContent;
  onInvestigate: (type: 'user' | 'contribution' | 'interaction' | 'message', id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">High Risk Contributions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Redactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.highRiskContributions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{c.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.area}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      c.riskScore > 0.9 ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {(c.riskScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.redactions}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onInvestigate('contribution', c.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">Suspicious Users (Low Trust Score)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Handle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trust Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Suspended</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.suspiciousUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{u.handle}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{u.role}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      u.trustScore < 25 ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {u.trustScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.isSuspended ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-900 text-red-200">Yes</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onInvestigate('user', u.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Investigations Section
function InvestigationsSection({ data }: { data: { investigations: Investigation[] } }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">Recent Investigations</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Target Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Target ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.investigations.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-300">{inv.adminUserId}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{inv.reason || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{inv.targetType || 'N/A'}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-300">{inv.targetId?.slice(0, 8) || 'N/A'}...</td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(inv.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audit Logs Section
function AuditLogsSection({ data }: { data: { logs: AuditLog[] } }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-lg font-medium text-white p-4 border-b border-gray-700">Admin Access Logs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Fields</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-300">{log.adminUserId}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{log.action}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{log.reason || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {log.targetType && log.targetId ? `${log.targetType}:${log.targetId.slice(0, 8)}...` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {log.fieldsAccessed.length > 0 ? log.fieldsAccessed.join(', ') : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}