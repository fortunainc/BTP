import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scryptSync } from 'node:crypto';
import { NextRequest } from 'next/server';

const db = vi.hoisted(() => ({ investor: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/write-rate-limit', () => ({ checkWriteRateLimit: vi.fn(async () => ({ allowed: true, retryAfter: 60 })) }));
vi.mock('@/lib/traffic', () => ({ recordTraffic: vi.fn(async () => undefined) }));
vi.mock('@/lib/mailer', () => ({ sendEmail: vi.fn(async () => true) }));
import { sendEmail } from '@/lib/mailer';
import { createPersonSession, normalizeInvestorEmail, personFromSession, roomViewer } from '@/lib/investor-access';
import { SESSION_SECONDS } from '@/lib/investor-auth';
import { POST as requestAccess } from '@/app/investors/request/route';
import { GET as enter } from '@/app/investors/enter/route';

const salt = 'ab'.repeat(16);
beforeEach(() => {
  vi.stubEnv('BTP_INVESTOR_KEY', Buffer.alloc(32, 7).toString('base64'));
  vi.stubEnv('BTP_INVESTOR_PASSWORD_HASH', salt + ':' + scryptSync('pw', salt, 64).toString('hex'));
  vi.stubEnv('VERCEL_ENV', 'production');
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const form = (body: Record<string, string>, origin = 'https://btp.test') => new NextRequest('https://btp.test/investors/request', { method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });

describe('per-investor access', () => {
  it('normalizes emails and rejects junk', () => {
    expect(normalizeInvestorEmail('  Jane@Fund.COM ')).toBe('jane@fund.com');
    expect(normalizeInvestorEmail('nope')).toBeNull();
    expect(normalizeInvestorEmail(5)).toBeNull();
  });
  it('signs sessions to one investor and rejects tampering and expiry', () => {
    const now = Date.now();
    const token = createPersonSession('ckinvestor0001', now);
    expect(personFromSession(token, now)).toBe('ckinvestor0001');
    expect(personFromSession(token.replace('ckinvestor0001', 'ckinvestor0002'), now)).toBeNull();
    expect(personFromSession(token, now + SESSION_SECONDS * 1000)).toBeNull();
  });
  it('revoking an investor ends their session immediately', async () => {
    const token = createPersonSession('ckinvestor0001');
    db.investor.findUnique.mockResolvedValueOnce({ id: 'ckinvestor0001', status: 'approved', name: 'Jane', company: 'Fund' });
    expect(await roomViewer(token)).toMatchObject({ kind: 'investor', id: 'ckinvestor0001' });
    db.investor.findUnique.mockResolvedValueOnce({ id: 'ckinvestor0001', status: 'revoked' });
    expect(await roomViewer(token)).toBeNull();
  });
  it('saves unknown emails as requests and sends nothing', async () => {
    db.investor.findUnique.mockResolvedValueOnce(null);
    const res = await requestAccess(form({ email: 'new@fund.com', name: 'Jane Doe, Fund' }));
    expect(res.headers.get('location')).toContain('sent=1');
    expect(db.investor.create).toHaveBeenCalledWith({ data: { email: 'new@fund.com', name: 'Jane Doe', company: 'Fund' } });
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it('emails a link only to approved investors, with the same page message', async () => {
    db.investor.findUnique.mockResolvedValueOnce({ id: 'inv1', status: 'approved' });
    const res = await requestAccess(form({ email: 'ok@fund.com' }));
    expect(res.headers.get('location')).toContain('sent=1');
    expect(sendEmail).toHaveBeenCalledWith('ok@fund.com', expect.any(String), expect.stringContaining('/investors/enter?token='));
  });
  it('does not email pending or revoked investors', async () => {
    db.investor.findUnique.mockResolvedValueOnce({ id: 'inv1', status: 'revoked' });
    await requestAccess(form({ email: 'no@fund.com' }));
    expect(sendEmail).not.toHaveBeenCalled();
    expect(db.investor.create).not.toHaveBeenCalled();
  });
  it('blocks cross-origin requests', async () => {
    expect((await requestAccess(form({ email: 'a@b.co' }, 'https://evil.test'))).status).toBe(403);
  });
  it('rejects unknown or expired links without a session', async () => {
    db.investor.findUnique.mockResolvedValueOnce({ id: 'inv1', status: 'approved', tokenExpires: new Date(Date.now() - 1000) });
    const res = await enter(new NextRequest('https://btp.test/investors/enter?token=abc'));
    expect(res.headers.get('location')).toContain('error=link');
    expect(res.headers.get('set-cookie')).toBeNull();
  });
  it('opens the room from a valid link', async () => {
    db.investor.findUnique.mockResolvedValueOnce({ id: 'ckinvestor0001', status: 'approved', tokenExpires: new Date(Date.now() + 60_000) });
    const res = await enter(new NextRequest('https://btp.test/investors/enter?token=abc'));
    expect(res.headers.get('set-cookie')).toContain('Path=/investors');
  });
});
