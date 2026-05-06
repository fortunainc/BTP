/**
 * Operator Profile Page
 * 
 * Architecture Rules:
 * - Profile data is used for Capability Identity generation
 * - Shows profile completeness
 * - No trust scores shown (internal only)
 * - No tier system (deprecated)
 * - Shows contribution count and therapeutic areas
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { User, MapPin, Clock, Edit, CheckCircle, AlertCircle, Shield, FileText, DollarSign } from 'lucide-react';

interface ProfileData {
  id: string;
  yearsOfExperience: number;
  therapeuticAreas: string[];
  platforms: string[];
  skills: string[];
  hourlyRate: string | null;
  availabilityStatus: string;
  location: string | null;
  bio: string | null;
  certifications: string[];
  languages: string[];
  preferredWorkType: string | null;
  roleTitle?: string | null;
  organizationType?: string | null;
}

interface ContributionStats {
  totalContributions: number;
  breakdown: {
    situation: number;
    pattern: number;
    solution: number;
    question: number;
    insight: number;
  };
  topTherapeuticAreas: Array<{
    area: string;
    count: number;
  }>;
}

interface CapabilityIdentity {
  id: string;
  anonymousId: string;
  therapeuticAreas: Array<{
    area: string;
    confidence: number;
  }>;
  trialPhases: Array<{
    phase: string;
    count: number;
  }>;
  overallMatchScore: number;
  isActive: boolean;
}

export default function OperatorProfilePage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [contributionStats, setContributionStats] = useState<ContributionStats | null>(null);
  const [capabilityIdentity, setCapabilityIdentity] = useState<CapabilityIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    yearsOfExperience: 0,
    therapeuticAreas: [] as string[],
    platforms: [] as string[],
    skills: [] as string[],
    hourlyRate: '',
    availabilityStatus: 'Available',
    location: '',
    bio: '',
    certifications: [] as string[],
    languages: [] as string[],
    preferredWorkType: '',
    roleTitle: '',
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const [profileRes, statsRes, identityRes] = await Promise.all([
        fetch('/api/operator/profile'),
        fetch('/api/operator/contribution-stats'),
        fetch('/api/operator/capability-identity'),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setFormData({
          yearsOfExperience: profileData.yearsOfExperience || 0,
          therapeuticAreas: profileData.therapeuticAreas || [],
          platforms: profileData.platforms || [],
          skills: profileData.skills || [],
          hourlyRate: profileData.hourlyRate || '',
          availabilityStatus: profileData.availabilityStatus || 'Available',
          location: profileData.location || '',
          bio: profileData.bio || '',
          certifications: profileData.certifications || [],
          languages: profileData.languages || [],
          preferredWorkType: profileData.preferredWorkType || '',
          roleTitle: profileData.roleTitle || '',
        });
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setContributionStats(statsData);
      }

      if (identityRes.ok) {
        const identityData = await identityRes.json();
        setCapabilityIdentity(identityData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/operator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setProfile(await response.json());
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompleteness = () => {
    if (!profile) return 0;
    const required = [
      profile.yearsOfExperience > 0,
      profile.therapeuticAreas.length > 0,
      profile.skills.length > 0,
      profile.location,
      profile.bio,
      profile.availabilityStatus,
    ];
    const completed = required.filter(Boolean).length;
    return Math.round((completed / required.length) * 100);
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="max-w-md text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Sign in to view and edit your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading profile...</div>;
  }

  const completeness = calculateProfileCompleteness();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Operator Profile</h1>
              <p className="mt-1 text-sm text-gray-600">Your profile determines opportunity matching</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completeness Warning */}
        {completeness < 80 && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete Your Profile for Better Matches
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your profile is {completeness}% complete. Complete your profile to receive more relevant opportunity matches.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.roleTitle}
                      onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.roleTitle || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.yearsOfExperience || 0} years</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  {editing ? (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="City, State or Remote"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-gray-900">{profile?.location || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  {editing ? (
                    <select
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-gray-900">{profile?.availabilityStatus || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                  {editing ? (
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., $75-100/hour"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{profile?.hourlyRate || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  {editing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe your experience and expertise..."
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.bio || 'Not specified'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Expertise */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Expertise</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Therapeutic Areas</label>
                  {editing ? (
                    <textarea
                      value={formData.therapeuticAreas.join(', ')}
                      onChange={(e) => setFormData({ ...formData, therapeuticAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Oncology, Cardiovascular, Neurology"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.therapeuticAreas.map((area, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Trial Platforms</label>
                  {editing ? (
                    <textarea
                      value={formData.platforms.join(', ')}
                      onChange={(e) => setFormData({ ...formData, platforms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Medidata Rave, Veeva Vault"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.platforms.map((platform, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700 border border-gray-200">
                          {platform}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  {editing ? (
                    <textarea
                      value={formData.skills.join(', ')}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Patient enrollment, Protocol adherence, EDC"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills.map((skill, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Contribution Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Your Contributions
              </h2>
              
              {contributionStats ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-3xl font-bold text-indigo-700">{contributionStats.totalContributions}</p>
                    <p className="text-sm text-indigo-600">Total Contributions</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">By Type</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Situations</span>
                        <span className="font-medium text-gray-900">{contributionStats.breakdown.situation}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Patterns</span>
                        <span className="font-medium text-gray-900">{contributionStats.breakdown.pattern}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Solutions</span>
                        <span className="font-medium text-gray-900">{contributionStats.breakdown.solution}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Questions</span>
                        <span className="font-medium text-gray-900">{contributionStats.breakdown.question}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Insights</span>
                        <span className="font-medium text-gray-900">{contributionStats.breakdown.insight}</span>
                      </div>
                    </div>
                  </div>

                  {contributionStats.topTherapeuticAreas.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Top Areas</p>
                      <div className="space-y-2">
                        {contributionStats.topTherapeuticAreas.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.area.replace('_', ' ')}</span>
                            <span className="font-medium text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No contribution data</p>
              )}
            </div>

            {/* Capability Identity Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                Your Capability Identity
              </h2>
              
              {capabilityIdentity ? (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-indigo-600 mb-1">Anonymous ID</p>
                    <p className="text-sm font-mono font-medium text-indigo-900">{capabilityIdentity.anonymousId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Therapeutic Areas (Confidence)</p>
                    <div className="space-y-2">
                      {capabilityIdentity.therapeuticAreas.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{item.area.replace('_', ' ')}</span>
                          <span className="font-medium text-indigo-600">{Math.round(item.confidence * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-green-800">
                      Your Capability Identity is active and being used for opportunity matching
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Capability Identity not generated yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}