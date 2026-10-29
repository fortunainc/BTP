'use client';
import { FormEvent, useState } from 'react';
import { INQUIRY_ACCESS, parseCompanyInquiry, type InquiryErrors } from '@/lib/company-inquiry';

type Key = keyof InquiryErrors;
export default function InquiryForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [fields, setFields] = useState<InquiryErrors>({}), [done, setDone] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(['name', 'email', 'company', 'website', 'product', 'goals', 'access', 'fax'].map(k => [k, String(f.get(k) ?? '')]));
    const check = parseCompanyInquiry(body);
    if (!check.ok) { setFields(check.errors); setError('Please check the highlighted fields.'); focusFirst(check.errors); return; }
    setFields({}); setBusy(true);
    try {
      const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { if (data.fields) { setFields(data.fields); focusFirst(data.fields); } throw new Error(data.error || 'We could not send your inquiry just now. Your answers are still here. Please try again.'); }
      setDone(check.data.email);
    } catch (err) { setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'We could not reach BTP. Check your connection and try again. Your answers are still here.'); }
    finally { setBusy(false); }
  }
  function focusFirst(errs: InquiryErrors) { const k = Object.keys(errs)[0]; if (k) setTimeout(() => document.getElementById('ci-' + k)?.focus(), 0); }
  if (done) return <div role="status" className="co-done"><p className="bw-kicker">Inquiry received</p><h3>Thank you. Your inquiry is with BTP.</h3><p>We will review it and contact you at {done} to discuss scope. This is not a confirmed review or timeline.</p></div>;
  const err = (k: Key) => fields[k] ? <span id={`ci-${k}-err`} className="bw-error co-ferr">{fields[k]}</span> : null;
  const a = (k: Key) => ({ id: `ci-${k}`, name: k, 'aria-invalid': !!fields[k] || undefined, 'aria-describedby': fields[k] ? `ci-${k}-err` : undefined });
  return <form onSubmit={submit} noValidate aria-label="Discuss a product review">
    <label htmlFor="ci-name">Name</label><input {...a('name')} autoComplete="name" maxLength={120} />{err('name')}
    <label htmlFor="ci-email">Work email</label><input {...a('email')} type="email" autoComplete="email" maxLength={254} />{err('email')}
    <label htmlFor="ci-company">Company name</label><input {...a('company')} autoComplete="organization" maxLength={160} />{err('company')}
    <label htmlFor="ci-website">Company website</label><input {...a('website')} inputMode="url" autoComplete="url" maxLength={200} placeholder="example.com" />{err('website')}
    <label htmlFor="ci-product">Your product and who uses it</label><small>For example, a referral tool used by site coordinators.</small><textarea {...a('product')} rows={3} maxLength={1200} />{err('product')}
    <label htmlFor="ci-goals">What you want to learn or improve</label><textarea {...a('goals')} rows={3} maxLength={1200} />{err('goals')}
    <fieldset className="co-radios" aria-describedby={fields.access ? 'ci-access-err' : undefined}><legend>What can you share with reviewers?</legend>
      {INQUIRY_ACCESS.map(([k, l], i) => <label key={k} className="bw-check"><input type="radio" name="access" value={k} id={i === 0 ? 'ci-access' : undefined} /><span>{l}</span></label>)}
      {err('access')}</fieldset>
    <div className="bw-trap" aria-hidden="true"><label htmlFor="ci-fax">Fax</label><input id="ci-fax" name="fax" tabIndex={-1} autoComplete="off" /></div>
    {error && <p role="alert" className="bw-error">{error}</p>}
    <button disabled={busy}>{busy ? 'Sending…' : 'Discuss a product review'}</button>
    <p className="bw-small">BTP uses these details only to discuss a possible review. See our <a href="/privacy">privacy policy</a>.</p>
  </form>;
}
