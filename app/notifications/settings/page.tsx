'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { NOTIFICATION_PREFERENCES, type NotificationPreferences } from '@/lib/notification-preferences';

export default function NotificationSettingsPage() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<NotificationPreferences | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (loading || !user) return;
    fetch('/api/notifications/settings').then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load preferences.');
      setSettings(data);
    }).catch(error => setMessage(error.message));
  }, [loading, user]);
  async function save() {
    if (!settings) return;
    setSaving(true); setMessage('');
    try {
      const body = Object.fromEntries(['inAppEnabled', ...NOTIFICATION_PREFERENCES.map(p => p.key)].map(key => [key, settings[key as keyof NotificationPreferences]]));
      const res = await fetch('/api/notifications/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Could not save preferences. Please try again.');
      setMessage('Preferences saved.');
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Could not save preferences.'); }
    finally { setSaving(false); }
  }
  return <main className="mx-auto max-w-2xl px-5 py-10 text-[#f2eadf]">
    <Link href="/notifications" className="text-[#e8cc94]">← Back to notifications</Link>
    <h1 className="mt-6 text-3xl">Notification settings</h1>
    <p className="mt-3 text-[#d9ccbd]">Choose the updates you see inside BTP. Community email alerts, push notifications and scheduled digests are not available yet.</p>
    {loading ? <p className="mt-6">Loading…</p> : !user ? <Link href="/sign-in?redirect_url=%2Fnotifications%2Fsettings" className="mt-6 block underline">Sign in to manage notifications</Link> : settings ? <div className="mt-8 space-y-4">
      {[{ key: 'inAppEnabled' as const, label: 'Show updates inside BTP', description: 'Turn community notifications on or off.' }, ...NOTIFICATION_PREFERENCES].map(p => <label key={p.key} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input type="checkbox" className="mt-1 accent-[#e8cc94]" checked={settings[p.key]} disabled={saving} onChange={e => setSettings({...settings, [p.key]: e.target.checked})}/>
        <span><span className="block font-medium">{p.label}</span><span className="mt-1 block text-sm text-[#d9ccbd]">{p.description}</span></span>
      </label>)}
      <button className="btn-primary rounded px-5 py-3 disabled:opacity-50" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save preferences'}</button>
    </div> : !message ? <p className="mt-6">Loading preferences…</p> : null}
    {message && <p role="status" className="mt-5">{message}</p>}
  </main>;
}
