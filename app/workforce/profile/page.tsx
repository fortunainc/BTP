'use client';

import { useState, useEffect } from 'react';
import { User, Briefcase, MapPin, Clock, DollarSign, CheckCircle, Edit, Award, Shield } from 'lucide-react';
import HelpfulScore from '@/components/HelpfulScore';
import UserBadges from '@/components/UserBadges';

interface OperatorProfile {
  id: string;
  userId: string;
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
  user: {
    id: string;
    anonymousHandle: string;
    operatorTier: string;
    helpfulScore?: number;
    isFoundingOperator?: boolean;
  };
}

export default function OperatorProfilePage() {
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    preferredWorkType: ''
  });

  const therapeuticAreas = [
    'Oncology', 'Cardiology', 'Neurology', 'Immunology', 'Respiratory',
    'Endocrinology', 'Gastroenterology', 'Dermatology', 'Infectious Disease', 'Rare Disease'
  ];

  const platforms = [
    'Medidata Rave', 'Oracle Clinical', 'ClinBase', 'Veeva Vault', 'TrialKey',
    'REDCap', 'Inform', 'ClinSpark'
  ];

  const commonSkills = [
    'Medidata Rave', 'Oracle Clinical', 'EDC', 'SAS', 'CDISC', 'GCP',
    'FDA Regulations', 'ICH Guidelines', 'Clinical Data Management',
    'Protocol Deviation', 'SAE Reporting', 'Informed Consent'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/operator-profiles?userId=me');
      const data = await response.json();
      setProfile(data);
      if (data) {
        setFormData({
          yearsOfExperience: data.yearsOfExperience || 0,
          therapeuticAreas: data.therapeuticAreas || [],
          platforms: data.platforms || [],
          skills: data.skills || [],
          hourlyRate: data.hourlyRate || '',
          availabilityStatus: data.availabilityStatus || 'Available',
          location: data.location || '',
          bio: data.bio || '',
          certifications: data.certifications || [],
          languages: data.languages || [],
          preferredWorkType: data.preferredWorkType || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (items: string[], item: string, setItems: (items: string[]) => void) => {
    setItems(
      items.includes(item)
        ? items.filter(i => i !== item)
        : [...items, item]
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/operator-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save profile');

      alert('Profile saved successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Operator Profile</h1>
            <p className="text-gray-600">Showcase your expertise to attract work opportunities</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          /* Edit Mode */
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-6">
              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Therapeutic Areas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Therapeutic Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {therapeuticAreas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleItem(formData.therapeuticAreas, area, (items) =>
                        setFormData({ ...formData, therapeuticAreas: items })
                      )}
                      className={`px-3 py-2 rounded-lg border-2 transition-all ${
                        formData.therapeuticAreas.includes(area)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Platform Expertise
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleItem(formData.platforms, platform, (items) =>
                        setFormData({ ...formData, platforms: items })
                      )}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        formData.platforms.includes(platform)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleItem(formData.skills, skill, (items) =>
                        setFormData({ ...formData, skills: items })
                      )}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        formData.skills.includes(skill)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Hourly Rate
                </label>
                <input
                  type="text"
                  placeholder="e.g., $50-75/hr"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Available">Available</option>
                  <option value="Limited">Limited Availability</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Remote or Boston, MA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your experience and expertise..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., CCRC, CCRP, GCP Certified"
                  value={formData.certifications.join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    certifications: e.target.value.split('\n').filter(c => c.trim())
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Languages
                </label>
                <input
                  type="text"
                  placeholder="e.g., English, Spanish, French"
                  value={formData.languages.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Preferred Work Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Work Type
                </label>
                <input
                  type="text"
                  placeholder="e.g., Remote, On-site, Hybrid"
                  value={formData.preferredWorkType}
                  onChange={(e) => setFormData({ ...formData, preferredWorkType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          profile && (
            <div className="space-y-6">
              {/* Overview Card */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{profile.user.anonymousHandle}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {profile.user.operatorTier}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          profile.availabilityStatus === 'Available' ? 'bg-green-100 text-green-700' :
                          profile.availabilityStatus === 'Limited' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {profile.availabilityStatus}
                        </span>
                        <HelpfulScore score={profile.user.helpfulScore || 0} size="sm" variant="highlighted" />
                        <UserBadges isFoundingOperator={profile.user.isFoundingOperator || false} />
                      </div>
                      {(profile.roleTitle || profile.organizationType) && (
                        <div className="text-sm text-gray-600 mt-1">
                          {profile.roleTitle && <span>{profile.roleTitle}</span>}
                          {profile.roleTitle && profile.organizationType && <span> — </span>}
                          {profile.organizationType && <span>{profile.organizationType}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  {profile.hourlyRate && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Hourly Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{profile.hourlyRate}</p>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <div className="mb-6">
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Experience</span>
                    </div>
                    <p className="font-semibold text-gray-900">{profile.yearsOfExperience} years</p>
                  </div>
                  {profile.location && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                      <p className="font-semibold text-gray-900">{profile.location}</p>
                    </div>
                  )}
                  {profile.preferredWorkType && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span>Work Type</span>
                      </div>
                      <p className="font-semibold text-gray-900">{profile.preferredWorkType}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Therapeutic Areas */}
              {profile.therapeuticAreas.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Therapeutic Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.therapeuticAreas.map((area, idx) => (
                      <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platforms */}
              {profile.platforms.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Platform Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.platforms.map((platform, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications & Languages */}
              {(profile.certifications.length > 0 || profile.languages.length > 0) && (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {profile.certifications.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Certifications</h3>
                        <ul className="space-y-2">
                          {profile.certifications.map((cert, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span>{cert}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {profile.languages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.languages.map((lang, idx) => (
                            <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}