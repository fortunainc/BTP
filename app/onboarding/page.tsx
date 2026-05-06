'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type UserRole = 'operator' | 'organization';
type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Step 1: Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Step 2: Professional information
  const [formData, setFormData] = useState({
    linkedinUrl: '',
    anonymousHandle: '',
    roleCategory: '',
    companyType: '',
  });
  
  // Step 3: Email verification
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // Redirect if user is already verified (onboarding is complete)
    if (user?.verificationStatus === 'Approved') {
      router.push('/situations');
    }
  }, [user, authLoading, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setStep(2);
  };

  const validateStep2 = () => {
    if (!formData.linkedinUrl) {
      setError('LinkedIn URL is required for verification');
      return false;
    }
    
    const linkedinRegex = /^https?://(www.)?linkedin.com\/in\/[\w-]+\/?$/;
    if (!linkedinRegex.test(formData.linkedinUrl)) {
      setError('Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)');
      return false;
    }
    
    if (!formData.anonymousHandle) {
      setError('Anonymous handle is required');
      return false;
    }
    
    if (formData.anonymousHandle.length < 3) {
      setError('Anonymous handle must be at least 3 characters');
      return false;
    }
    
    if (selectedRole === 'operator' && !formData.roleCategory) {
      setError('Please select your role category');
      return false;
    }
    
    if (selectedRole === 'organization' && !formData.companyType) {
      setError('Please select your company type');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleStep2Next = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: selectedRole,
          linkedinUrl: formData.linkedinUrl,
          anonymousHandle: formData.anonymousHandle,
          roleCategory: selectedRole === 'operator' ? formData.roleCategory : null,
          companyType: selectedRole === 'organization' ? formData.companyType : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your work email');
      return;
    }

    // Reject personal email domains
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (personalDomains.includes(domain)) {
      setError('Please use your work email address (personal emails not accepted)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/user/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification email');
      }

      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setVerifying(true);
    setError('');
    
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      // Redirect to dashboard, account will be in "Pending" status
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            {step === 1 && 'Choose your role in the clinical trials ecosystem'}
            {step === 2 && 'Provide your professional information'}
            {step === 3 && 'Verify your work email address'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                s <= step ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <button
              onClick={() => handleRoleSelect('operator')}
              className="w-full p-6 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Operator</h3>
                  <p className="text-gray-400">
                    Clinical Research Associates, Coordinators, PIs, and other trial professionals
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">CRA</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">CRC</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">PI</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">PM</span>
                  </div>
                </div>
                <div className="text-4xl">👷</div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('organization')}
              className="w-full p-6 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Organization</h3>
                  <p className="text-gray-400">
                    CROs, Clinical Sites, Sponsors, and other trial organizations
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">CRO</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">Site</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">Sponsor</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">Vendor</span>
                  </div>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Professional Information */}
        {step === 2 && (
          <div className="space-y-6">
            {selectedRole === 'operator' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Your Role</label>
                <select
                  value={formData.roleCategory}
                  onChange={(e) => setFormData({ ...formData, roleCategory: e.target.value })}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select your role...</option>
                  <option value="CRA">Clinical Research Associate</option>
                  <option value="CRC">Clinical Research Coordinator</option>
                  <option value="PI">Principal Investigator</option>
                  <option value="PM">Project Manager</option>
                  <option value="DM">Data Manager</option>
                  <option value="RM">Regulatory Manager</option>
                  <option value="QA">Quality Assurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Organization Type</label>
                <select
                  value={formData.companyType}
                  onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select your organization type...</option>
                  <option value="CRO">CRO</option>
                  <option value="Site">Clinical Site</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Vendor">Service Vendor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                LinkedIn URL <span className="text-slate-500 text-xs">(optional during alpha)</span>
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://www.linkedin.com/in/your-username"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for account verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Anonymous Handle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.anonymousHandle}
                onChange={(e) => setFormData({ ...formData, anonymousHandle: e.target.value })}
                placeholder="Choose a unique anonymous handle"
                minLength={3}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your public identifier (min 3 characters)
              </p>
            </div>

            <button
              onClick={handleStep2Next}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 3: Email Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Work Email <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@company.com"
                  disabled={codeSent}
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
                {!codeSent && (
                  <button
                    onClick={sendVerificationEmail}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Code'}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Personal email domains (gmail, yahoo, etc.) are not accepted
              </p>
            </div>

            {codeSent && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-center tracking-widest text-xl font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the code sent to {email}
                  </p>
                </div>

                <button
                  onClick={verifyCode}
                  disabled={verifying || !verificationCode || verificationCode.length !== 6}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {verifying ? 'Verifying...' : 'Complete Verification'}
                </button>

                <button
                  onClick={() => {
                    setCodeSent(false);
                    setEmail('');
                    setVerificationCode('');
                  }}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Change Email Address
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your account will be reviewed by our team after verification.</p>
          <p>You will have read-only access until approved.</p>
        </div>
      </div>
    </div>
  );
}