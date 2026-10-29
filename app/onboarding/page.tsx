'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type Step = 'profile' | 'verify' | 'done';
type Method = 'linkedin' | 'work_email' | 'vouch';

const ROLES: Array<[string, string]> = [
  ['CRA', 'Clinical Research Associate'], ['CRC', 'Clinical Research Coordinator'], ['PI', 'Principal Investigator'],
  ['PM', 'Project Manager'], ['DM', 'Data Manager'], ['RM', 'Regulatory Manager'], ['QA', 'Quality Assurance'], ['Other', 'Other'],
];
const ORG_TYPES: Array<[string, string]> = [['CRO', 'CRO'], ['Site', 'Clinical site'], ['Sponsor', 'Pharma/biotech'], ['Vendor', 'Service vendor'], ['Independent', 'Independent or between roles'], ['Other', 'Other']];

const label = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]';
const field = 'w-full rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 p-3 text-white placeholder:text-[#9c8a78] focus:border-[#c9a66b] focus:outline-none';
const hint = 'mt-1.5 text-xs leading-5 text-slate-400';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ roleCategory: '', companyType: '', yearsExperience: '', handle: '', linkedinUrl: '' });
  const [method, setMethod] = useState<Method>('linkedin');
  const [vouchNote, setVouchNote] = useState('');
  const [vouchLink, setVouchLink] = useState('');
  const [vouchState, setVouchState] = useState<'none' | 'waiting' | 'vouched'>('none');
  const [copied, setCopied] = useState(false);
  const [proofCode, setProofCode] = useState<string | null>(null);
  const [workEmail, setWorkEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user?.verificationStatus === 'Approved' && user.roleCategory && user.roleCategory !== 'unspecified') router.push('/situations');
  }, [user, authLoading, router]);

  useEffect(() => { void suggestHandle(false); }, []);

  // Returning from the one-click link in the work email.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('email');
    if (!status) return;
    setStep('verify');
    setMethod('work_email');
    if (status === 'confirmed') setEmailVerified(true);
    else setError(status === 'in-use' ? 'That work email is already linked to another BTP account.' : 'That link has expired or was already used. Send a new one.');
  }, []);

  async function suggestHandle(fresh: boolean) {
    const res = await fetch(`/api/user/handle-suggestion${fresh ? '?fresh=1' : ''}`).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    if (data?.handle) setForm(f => ({ ...f, handle: data.handle }));
  }

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  function profileError(): string {
    if (!form.roleCategory) return 'Choose your role.';
    if (!form.companyType) return 'Choose where you work.';
    const years = Number(form.yearsExperience);
    if (form.yearsExperience === '' || !Number.isInteger(years) || years < 0 || years > 50) return 'Enter your years of experience (0 to 50).';
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(form.handle.trim())) return 'Your handle needs 3 to 30 letters, numbers or dashes.';
    return '';
  }

  async function saveProfile(linkedinUrl = '') {
    const data = await post('/api/user/onboarding', {
      userRole: 'operator', anonymousHandle: form.handle.trim(), roleCategory: form.roleCategory,
      companyType: form.companyType, yearsExperience: Number(form.yearsExperience), linkedinUrl,
    });
    return data as { linkedinProofCode?: string | null };
  }

  async function next() {
    const problem = profileError();
    if (problem) { setError(problem); return; }
    setBusy(true); setError('');
    try { await saveProfile(); setStep('verify'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function submitLinkedIn() {
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(form.linkedinUrl.trim())) { setError('Enter your LinkedIn profile link, like https://www.linkedin.com/in/your-name'); return; }
    setBusy(true); setError('');
    try { const data = await saveProfile(form.linkedinUrl.trim()); setProofCode(data.linkedinProofCode ?? null); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function createVouchLink() {
    setBusy(true); setError('');
    try { const data = await post('/api/user/vouch-request', { note: vouchNote }); setVouchLink(data.link); setVouchState('waiting'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function checkVouch() {
    const res = await fetch('/api/user/vouch-request').catch(() => null);
    const data = res?.ok ? await res.json() : null;
    if (data?.status) setVouchState(data.status);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(vouchLink); setCopied(true); } catch { setCopied(false); }
  }

  async function sendEmailCode() {
    setBusy(true); setError('');
    try { await post('/api/user/work-email/send', { email: workEmail }); setCodeSent(true); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const canFinish = method === 'linkedin' ? Boolean(proofCode) : method === 'vouch' ? vouchState !== 'none' : emailVerified;
  const steps: Array<[Step, string]> = [['profile', 'Your profile'], ['verify', 'Confirm it is you'], ['done', 'Review']];
  const at = steps.findIndex(([s]) => s === step);

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <ol aria-label="Steps" className="mb-8 flex gap-3">
          {steps.map(([s, name], i) => (
            <li key={s} aria-current={i === at ? 'step' : undefined}
              className={`flex-1 border-t-[3px] pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${i <= at ? 'border-[#c9a66b]' : 'border-white/10'} ${i === at ? 'text-[#e8cc94]' : 'text-slate-500'}`}>{i + 1} · {name}</li>
          ))}
        </ol>

        {error && <div role="alert" className="mb-6 rounded-lg border border-[#c46b6b]/40 bg-[#c46b6b]/10 px-4 py-3 text-[#f1b7b7]">{error}</div>}

        {step === 'profile' && (
          <section>
            <h1 className="mb-2 text-4xl text-[#fff6ea]">Set up your <span className="text-[#e8cc94]">profile.</span></h1>
            <p className="mb-8 text-slate-400">Members see only your handle and your verified role. Your name and employer stay private. BTP plans to use aggregated community insights to understand shared challenges and inform research and product evaluations. Companies do not receive your private conversations or identity. <a href="/privacy#aggregated" className="underline">Learn more</a>.</p>
            <div className="space-y-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-6">
              <div>
                <label htmlFor="role" className={label}>Your role</label>
                <select id="role" value={form.roleCategory} onChange={e => setForm({ ...form, roleCategory: e.target.value })} className={field}>
                  <option value="">Select your role…</option>
                  {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="org" className={label}>Where you work</label>
                <select id="org" value={form.companyType} onChange={e => setForm({ ...form, companyType: e.target.value })} className={field}>
                  <option value="">Select organization type…</option>
                  {ORG_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="years" className={label}>Years of experience in clinical research</label>
                <input id="years" type="number" min={0} max={50} inputMode="numeric" value={form.yearsExperience}
                  onChange={e => setForm({ ...form, yearsExperience: e.target.value })} className={`${field} max-w-[160px]`} />
                <p className={hint}>BTP checks this against your LinkedIn or other evidence during review.</p>
              </div>
              <div>
                <label htmlFor="handle" className={label}>Your handle</label>
                <div className="flex gap-2">
                  <input id="handle" value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value })} maxLength={30} className={field} />
                  <button type="button" onClick={() => void suggestHandle(true)} className="whitespace-nowrap rounded-lg border border-[rgba(232,204,148,0.38)] px-4 text-sm text-[#e8cc94] hover:bg-[rgba(201,166,107,0.08)]">Shuffle</button>
                </div>
                <p className={hint}>We picked a random one. Keep it, shuffle, or type your own. Never use your real name or employer.</p>
              </div>
              <button type="button" onClick={next} disabled={busy} className="btn-primary w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50">{busy ? 'Saving…' : 'Next: confirm it is you →'}</button>
            </div>
          </section>
        )}

        {step === 'verify' && (
          <section>
            <h1 className="mb-2 text-4xl text-[#fff6ea]">Confirm <span className="text-[#e8cc94]">it is you.</span></h1>
            <p className="mb-6 text-slate-400">Choose one. BTP uses it only to confirm you work in clinical research, then deletes it as soon as your membership is approved. It is never shown to members.</p>
            <div className="mb-5 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Verification method">
              {([['linkedin', 'LinkedIn profile'], ['work_email', 'Work email'], ['vouch', 'A verified colleague']] as Array<[Method, string]>).map(([m, name]) => (
                <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => { setMethod(m); setError(''); }}
                  className={`rounded-xl border p-4 text-left text-sm ${method === m ? 'border-[rgba(232,204,148,0.55)] bg-[rgba(201,166,107,0.1)] text-[#fff6ea]' : 'border-white/10 text-[#d9ccbd]'}`}>{name}</button>
              ))}
            </div>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-6">
              {method === 'vouch' ? (
                vouchLink || vouchState !== 'none' ? (
                  <div>
                    {vouchState === 'vouched'
                      ? <p className="text-sm text-[#8fc79a]">A verified member has vouched for you. BTP will finish your review.</p>
                      : <p className="text-sm text-[#f1e7da]">Send this private link to a BTP member who worked with you. They sign in, read your note and vouch. It works once and expires in 14 days.</p>}
                    {vouchLink && vouchState !== 'vouched' && (
                      <div className="mt-4 flex gap-2">
                        <input readOnly value={vouchLink} className={`${field} font-mono text-xs`} onFocus={e => e.currentTarget.select()} />
                        <button type="button" onClick={copyLink} className="whitespace-nowrap rounded-lg border border-[rgba(232,204,148,0.38)] px-4 text-sm text-[#e8cc94]">{copied ? 'Copied' : 'Copy'}</button>
                      </div>
                    )}
                    {vouchState !== 'vouched' && <button type="button" onClick={checkVouch} className="mt-3 text-sm text-[#e8cc94] hover:underline">Check if they have vouched</button>}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="vn" className={label}>How you worked together</label>
                    <textarea id="vn" rows={4} maxLength={500} value={vouchNote} onChange={e => setVouchNote(e.target.value)} placeholder="e.g. We were coordinators on the same oncology team, 2016 to 2020." className={field} />
                    <p className={hint}>Only your colleague and the BTP reviewer see this note. It is deleted once you are approved. For people between roles or without a work email.</p>
                    <button type="button" onClick={createVouchLink} disabled={busy || vouchNote.trim().length < 20} className="btn-primary mt-4 w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50">{busy ? 'Creating…' : 'Create my vouch link'}</button>
                  </div>
                )
              ) : method === 'linkedin' ? (
                proofCode ? (
                  <div>
                    <p className="text-sm text-[#f1e7da]">Add this code anywhere in your LinkedIn headline or About section until you are approved:</p>
                    <p className="my-4 text-center font-mono text-3xl tracking-[0.2em] text-[#e8cc94]">{proofCode}</p>
                    <p className={hint}>It proves the profile is yours. Remove it after you hear from BTP. BTP also checks your years of experience on that profile.</p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="li" className={label}>Your LinkedIn profile link</label>
                    <input id="li" type="url" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://www.linkedin.com/in/your-name" className={field} />
                    <button type="button" onClick={submitLinkedIn} disabled={busy} className="btn-primary mt-4 w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50">{busy ? 'Saving…' : 'Get my code'}</button>
                  </div>
                )
              ) : emailVerified ? (
                <p className="text-sm text-[#8fc79a]">Work email confirmed. BTP deletes the address once your membership is approved and keeps only a scrambled marker so it can&apos;t be reused.</p>
              ) : (
                <div>
                  <label htmlFor="we" className={label}>Your work email</label>
                  <div className="flex gap-2">
                    <input id="we" type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} placeholder="you@yourcompany.com" className={field} />
                    <button type="button" onClick={sendEmailCode} disabled={busy || !workEmail.trim()} className="whitespace-nowrap rounded-lg border border-[rgba(232,204,148,0.38)] px-4 text-sm text-[#e8cc94] disabled:opacity-50">{codeSent ? 'Resend link' : 'Send link'}</button>
                  </div>
                  {codeSent && <p className="mt-3 text-sm text-[#f1e7da]">Check that inbox and click the link. It expires in 30 minutes. You can open it on any device.</p>}
                  <p className={hint}>Personal addresses like Gmail are not accepted. Between roles? Use the LinkedIn option instead.</p>
                </div>
              )}
              <button type="button" onClick={() => setStep('done')} disabled={!canFinish} className="btn-primary w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-40">Submit for review →</button>
              <button type="button" onClick={() => setStep('profile')} className="w-full text-sm text-slate-400 hover:text-white">← Back to profile</button>
            </div>
          </section>
        )}

        {step === 'done' && (
          <section className="rounded-2xl border border-[rgba(232,204,148,0.3)] bg-gradient-to-br from-[rgba(201,166,107,0.1)] to-white/[0.02] p-6">
            <h1 className="mb-3 text-3xl text-[#fff6ea]">Submitted for <span className="text-[#e8cc94]">review.</span></h1>
            <p className="text-slate-300">A person at BTP reviews every member privately. You will get an email when your membership is approved, and your LinkedIn link or work email is deleted at that point.</p>
            <button type="button" onClick={() => router.push('/situations')} className="btn-primary mt-5 rounded px-5 py-3 text-sm uppercase tracking-[0.16em]">Continue</button>
          </section>
        )}
      </div>
    </div>
  );
}
