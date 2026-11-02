import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  viewer: vi.fn(),
  log: vi.fn(),
  send: vi.fn(),
  limit: vi.fn(),
  db: { investor: { findUnique: vi.fn() }, diligenceRequest: { create: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ prisma: m.db }));
vi.mock('@/lib/investor-access', () => ({ roomViewer: m.viewer, logInvestorActivity: m.log, normalizeInvestorEmail: (v: unknown) => (typeof v === 'string' && v.includes('@') ? v.trim().toLowerCase() : null) }));
vi.mock('@/lib/mailer', () => ({ sendEmail: m.send }));
vi.mock('@/lib/write-rate-limit', () => ({ checkWriteRateLimit: m.limit }));

import { POST } from '@/app/investors/diligence/request/route';

const post = (body: string, origin = 'https://btp.test') => new NextRequest('https://btp.test/investors/diligence/request', { method: 'POST', body, headers: { origin, 'content-type': 'application/x-www-form-urlencoded' } });

describe('data room material requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.limit.mockResolvedValue({ allowed: true });
    m.db.diligenceRequest.create.mockResolvedValue({ id: 'd1' });
  });

  it('saves an approved investor request with only known sections and notifies the BTP inbox', async () => {
    m.viewer.mockResolvedValue({ kind: 'investor', id: 'i1' });
    m.db.investor.findUnique.mockResolvedValue({ id: 'i1', email: 'vc@fund.com', name: 'Ana', company: 'Fund' });
    const res = await POST(post('section=Financials&section=Market&section=Secrets&note=Cap+table+please'));
    expect(res.headers.get('location')).toContain('requested=1');
    expect(m.db.diligenceRequest.create).toHaveBeenCalledWith({ data: { investorId: 'i1', name: 'Ana', email: 'vc@fund.com', company: 'Fund', sections: 'Financials, Market', note: 'Cap table please' } });
    expect(m.log).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }), 'diligence_request');
    expect(m.send).toHaveBeenCalledWith('sasha@behindtheprotocol.ai', 'BTP data room request', expect.stringContaining('Financials, Market'));
  });

  it('asks a shared room visitor for an email and rejects empty requests', async () => {
    m.viewer.mockResolvedValue({ kind: 'shared' });
    expect((await POST(post('section=Market'))).headers.get('location')).toContain('error=email');
    expect((await POST(post('email=a%40b.com'))).headers.get('location')).toContain('error=empty');
    expect(m.db.diligenceRequest.create).not.toHaveBeenCalled();
  });

  it('refuses visitors without room access and cross origin posts', async () => {
    m.viewer.mockResolvedValue(null);
    expect((await POST(post('section=Market'))).headers.get('location')).toMatch(/\/investors$/);
    expect((await POST(post('section=Market', 'https://evil.test'))).status).toBe(403);
    expect(m.db.diligenceRequest.create).not.toHaveBeenCalled();
  });
});
