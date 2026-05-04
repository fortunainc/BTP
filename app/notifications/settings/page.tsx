"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Check,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Bell,
  Mail,
  Smartphone,
  Clock,
  Loader2,
  Save,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type NotificationClass = 'VALIDATION' | 'EXPANSION' | 'MOMENTUM' | 'PRESSURE' | 'OPPORTUNITY';

interface NotificationSettings {
  id: string;
  userId: string;
  validationEnabled: boolean;
  expansionEnabled: boolean;
  momentumEnabled: boolean;
  pressureEnabled: boolean;
  opportunityEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string | null;
  digestFrequency: 'real_time' | 'daily' | 'weekly';
  digestTime: number | null;
}

// ==========================================
// SETTINGS CONFIG
// ==========================================

const CLASS_CONFIG: {
  key: keyof NotificationSettings;
  class: NotificationClass;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'validationEnabled',
    class: 'VALIDATION',
    label: 'Validation',
    description: 'Recognition and confirmation from the community',
    icon: <Check className="w-5 h-5 text-emerald-400" />,
  },
  {
    key: 'expansionEnabled',
    class: 'EXPANSION',
    label: 'Insights',
    description: 'New insights and developments on your contributions',
    icon: <Lightbulb className="w-5 h-5 text-blue-400" />,
  },
  {
    key: 'momentumEnabled',
    class: 'MOMENTUM',
    label: 'Progress',
    description: 'Your progress and status changes',
    icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
  },
  {
    key: 'pressureEnabled',
    class: 'PRESSURE',
    label: 'Attention',
    description: 'Time-sensitive items requiring your attention',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  },
  {
    key: 'opportunityEnabled',
    class: 'OPPORTUNITY',
    label: 'Opportunities',
    description: 'New opportunities matching your profile',
    icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
  },
];

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function NotificationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  // Fetch settings
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notifications/settings');
        
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Update setting
  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  // Save settings
  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationEnabled: settings.validationEnabled,
          expansionEnabled: settings.expansionEnabled,
          momentumEnabled: settings.momentumEnabled,
          pressureEnabled: settings.pressureEnabled,
          opportunityEnabled: settings.opportunityEnabled,
          inAppEnabled: settings.inAppEnabled,
          emailEnabled: settings.emailEnabled,
          pushEnabled: settings.pushEnabled,
          quietHoursStart: settings.quietHoursStart,
          quietHoursEnd: settings.quietHoursEnd,
          timezone: settings.timezone,
          digestFrequency: settings.digestFrequency,
          digestTime: settings.digestTime,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate hour options
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
  }));

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/notifications"
                className="text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
              <h1 className="text-xl font-semibold text-slate-100">Notification Settings</h1>
            </div>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Save Message */}
        {saveMessage && (
          <div
            className={`p-3 rounded-lg ${
              saveMessage.includes('successfully')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Notification Types */}
        <section>
          <h2 className="text-lg font-medium text-slate-200 mb-4">Notification Types</h2>
          <p className="text-sm text-slate-400 mb-4">
            Choose which types of notifications you want to receive
          </p>
          <div className="space-y-3">
            {CLASS_CONFIG.map((config) => (
              <label
                key={config.key}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings[config.key] as boolean}
                  onChange={(e) => updateSetting(config.key, e.target.checked)}
                  className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="flex items-start gap-3 flex-1">
                  {config.icon}
                  <div>
                    <p className="font-medium text-slate-200">{config.label}</p>
                    <p className="text-sm text-slate-400">{config.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Delivery Methods */}
        <section>
          <h2 className="text-lg font-medium text-slate-200 mb-4">Delivery Methods</h2>
          <p className="text-sm text-slate-400 mb-4">
            Choose how you want to receive notifications
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.inAppEnabled}
                onChange={(e) => updateSetting('inAppEnabled', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <Bell className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-200">In-App Notifications</p>
                <p className="text-sm text-slate-400">Show notifications in the notification center</p>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-200">Email Notifications</p>
                <p className="text-sm text-slate-400">Receive notifications via email</p>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.pushEnabled}
                onChange={(e) => updateSetting('pushEnabled', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-200">Push Notifications</p>
                <p className="text-sm text-slate-400">Receive push notifications on your device</p>
              </div>
            </label>
          </div>
        </section>

        {/* Quiet Hours */}
        <section>
          <h2 className="text-lg font-medium text-slate-200 mb-4">Quiet Hours</h2>
          <p className="text-sm text-slate-400 mb-4">
            Set times when you don't want to be disturbed
          </p>
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300">Do not disturb from</span>
              <select
                value={settings.quietHoursStart ?? ''}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value ? parseInt(e.target.value) : null)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-slate-200"
              >
                <option value="">Off</option>
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="text-slate-300">to</span>
              <select
                value={settings.quietHoursEnd ?? ''}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value ? parseInt(e.target.value) : null)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-slate-200"
              >
                <option value="">Off</option>
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Timezone:</span>
              <select
                value={settings.timezone ?? ''}
                onChange={(e) => updateSetting('timezone', e.target.value || null)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-slate-200 flex-1"
              >
                <option value="">Use device timezone</option>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Digest Settings */}
        <section>
          <h2 className="text-lg font-medium text-slate-200 mb-4">Digest Settings</h2>
          <p className="text-sm text-slate-400 mb-4">
            Choose how often to receive notification digests
          </p>
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-slate-300">Frequency:</span>
              <select
                value={settings.digestFrequency}
                onChange={(e) => updateSetting('digestFrequency', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-slate-200 flex-1"
              >
                <option value="real_time">Real-time</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
            {(settings.digestFrequency === 'daily' || settings.digestFrequency === 'weekly') && (
              <div className="flex items-center gap-4">
                <span className="text-slate-300">Send at:</span>
                <select
                  value={settings.digestTime ?? 9}
                  onChange={(e) => updateSetting('digestTime', parseInt(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-slate-200"
                >
                  {hourOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}