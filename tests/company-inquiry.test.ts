import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const db = vi.hoisted(() => ({ companyInquiry: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() }, accessRequest: { upsert: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/write-rate-limit', () => ({ checkWriteRateLimit: vi.fn(async () => ({ allowed: true, retryAfter: 60 })) }));
import { normalizeWebsite, parseCompanyInquiry } from '@/lib/company-inquiry';
import { POST } from '@/app/api/companies/route';

const good = { name: 'TEST Inquiry', email: 'Test@Example.com', company: 'TEST Co', website: 'example.com', product: 'A referral tool for site coordinators.', goals: 'Whether referrals are easy to act on.', access: 'demo' };
const req = (body: unknown, origin = 'https://btp.test') => new NextRequest('https://btp.test/api/companies', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
afterEach(() => vi.clearAllMocks());

describe('company inquiry', () => {
  it('accepts a complete inquiry and normalizes it', () => {
    const r = parseCompanyInquiry(good);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.data.email).toBe('test@example.com'); expect(r.data.website).toBe('https://example.com'); }
  });
  it('reports every missing field', () => {
    const r = parseCompanyInquiry({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['access', 'company', 'email', 'goals', 'name', 'product', 'website']);
  });
  it('rejects unsafe or invalid websites and unknown access values', () => {
    expect(normalizeWebsite('javascript:alert(1)')).toBeNull();
    expect(normalizeWebsite('not a site')).toBeNull();
    expect(parseCompanyInquiry({ ...good, access: 'everything' }).ok).toBe(false);
  });
  it('stores a valid inquiry in CompanyInquiry, never the operator waitlist', async () => {
    db.companyInquiry.create.mockResolvedValue({ id: 'x' });
    const res = await POST(req(good));
    expect(res.status).toBe(200);
    expect(db.companyInquiry.create).toHaveBeenCalledWith({ data: expect.objectContaining({ company: 'TEST Co', access: 'demo' }) });
    expect(db.accessRequest.upsert).not.toHaveBeenCalled();
  });
  it('returns field errors without saving', async () => {
    const res = await POST(req({ ...good, email: 'nope' }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields.email).toBeTruthy();
    expect(db.companyInquiry.create).not.toHaveBeenCalled();
  });
  it('returns a useful error when storage fails', async () => {
    db.companyInquiry.create.mockRejectedValue(new Error('down'));
    const res = await POST(req(good));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/answers are still here/);
  });
  it('refuses cross origin posts and silently drops the trap field', async () => {
    expect((await POST(req(good, 'https://evil.test'))).status).toBe(403);
    expect((await POST(req({ ...good, fax: 'bot' }))).status).toBe(200);
    expect(db.companyInquiry.create).not.toHaveBeenCalled();
  });
});
