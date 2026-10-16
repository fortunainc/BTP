'use client';
import { useCallback, useEffect, useState } from 'react';
type Request = { id: string; userId: string; helpType: string; details: string; status: string; memberUpdate: string | null };
export default function HelpQueue() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [deletions, setDeletions] = useState<Array<{ id: string; userId: string; createdAt: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const response = await fetch('/api/admin/help-requests'); const body = await response.json(); if (!response.ok) throw new Error(body.error); setRequests(body.requests); setDeletions(body.deletionRequests); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function update(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { const response = await fetch('/api/admin/help-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: form.get('status'), memberUpdate: form.get('memberUpdate'), expertId: form.get('expertId'), consentConfirmed: form.get('consent') === 'on' }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Update failed'); }
  }
  return <main className="mx-auto max-w-3xl space-y-6 p-8"><h1 className="text-2xl">Private help and deletion requests</h1><p>Founder operations queue. Access is audited. Record consent before introducing members.</p>{error && <p role="alert">{error} <button onClick={() => void load()}>Retry</button></p>}
    <p><a className="underline" href="/admin/analytics">Back to founder analytics</a></p>{loading && <p role="status">Loading requests…</p>}
    <h2>Deletion requests</h2>{!loading && !error && deletions.length === 0 && <p>No pending deletion requests.</p>}<p>Follow the deletion fulfillment runbook. Requests remain pending until fulfillment is verified.</p>{deletions.map(item => <p key={item.id}>Request {item.id} · member {item.userId} · {new Date(item.createdAt).toLocaleDateString()}</p>)}
    <h2>Help requests</h2>{!loading && !error && requests.length === 0 && <p>No help requests.</p>}{requests.map(item => <form className="space-y-3 rounded border p-4" key={item.id} onSubmit={event => void update(event, item.id)}><h3>{item.helpType} · {item.status}</h3><p>{item.details}</p><p>Member: {item.userId}</p><p>{item.memberUpdate}</p><label>Status <select name="status" defaultValue={item.status}>{['NEW','REVIEWING','MATCHING','MATCHED','COMPLETED','CLOSED'].map(status => <option key={status}>{status}</option>)}</select></label><label className="block">Update visible to member <textarea className="block w-full border" required name="memberUpdate" maxLength={1000}/></label><label className="block">Expert member ID (when matching) <input name="expertId" className="border"/></label><label className="block"><input name="consent" type="checkbox"/> Both parties consented to this introduction</label><button className="rounded border p-2">Save update</button></form>)}
  </main>;
}
