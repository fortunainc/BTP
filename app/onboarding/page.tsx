'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type UserRole = 'operator' | 'organization';
type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Beta onboarding is for individual professionals; the organization path is dormant.
  const [step, setStep] = useState<Step>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Step 1: Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole | null>('operator');
  
  // Step 2: Professional information
  const [formData, setFormData] = useState({
    linkedinUrl: '',
    anonymousHandle: '',
    roleCategory: '',
    companyType: '',
  });
  
  // Step 3: Email verification

  useEffect(() => {
    if (authLoading) return;
    // Redirect if user is already verified (onboarding is complete)
    if (user?.verificationStatus === 'Approved' && user.roleCategory && user.roleCategory !== 'unspecified') {
      router.push('/situations');
    }
  }, [user, authLoading, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setStep(2);
  };

  const validateStep2 = () => {
    // LinkedIn URL is optional during alpha - no validation required
    // if (!formData.linkedinUrl) {
    //   setError('LinkedIn URL is required for verification');
    //   return false;
    // }
    
    // const linkedinRegex = /^https?://(www.)?linkedin.com\/in\/[\w-]+\/?$/;
    // if (!linkedinRegex.test(formData.linkedinUrl)) {
    //   setError('Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)');
    //   return false;
    // }
    
    if (!formData.anonymousHandle) {
      setError('Display handle is required');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.anonymousHandle.trim())) {
      setError('Display handle must be 3-30 letters, numbers, dashes or underscores');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            {step === 1 && 'Choose your role in the clinical trials ecosystem'}
            {step === 2 && 'Tell us your role and choose how you appear to members'}
            {step === 3 && 'Professional verification review'}
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
                LinkedIn URL <span className="text-slate-500 text-xs">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://www.linkedin.com/in/your-username"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Helps BTP verify your experience privately. Never shown to members. Prefer not to share it? Leave it blank and we will follow up by email about another way to verify, such as a reference from a verified member.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Display handle <span className="text-red-500">*</span>
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
                Shown to members instead of your name. Do not use your real name or employer (min 3 characters).
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

        {step === 3 && <div className="space-y-4 rounded-lg bg-slate-800 p-6"><h2 className="text-xl">Profile submitted for review</h2><p>BTP reviews professional verification privately during beta. Signing in verifies your account access; membership approval is a separate review. BTP will contact you by email once your membership has been reviewed.</p><button onClick={() => router.push('/situations')} className="rounded bg-blue-600 px-4 py-2">Continue</button></div>}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your profile is reviewed privately before community access is approved.</p>
          <p>Community access requires approval.</p>
        </div>
      </div>
    </div>
  );
}