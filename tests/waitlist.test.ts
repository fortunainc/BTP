import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
 db: { user: { findUnique: vi.fn() }, accessRequest: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() } },
 auth: vi.fn(), limit: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.db }));
vi.mock('@/lib/admin-auth', () => ({ verifyAdminAccess: mocks.auth }));
vi.mock('@/lib/write-rate-limit', () => ({ checkWriteRateLimit: mocks.limit }));
import { POST } from '@/app/api/join/route';
import { GET, PATCH } from '@/app/api/admin/waitlist/route';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
import { csvCell } from '@/lib/waitlist';
const payload = { email: ' Person@Example.com ', role: 'Coordinator', contactConsent: true, paidReviewInterest: false };
const req = (body: unknown, path='/api/join', origin='https://btp.test', method='POST') => new NextRequest('https://btp.test'+path, { method, headers: { origin, 'content-type':'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mocks.limit.mockResolvedValue({allowed:true,retryAfter:60}); mocks.db.accessRequest.upsert.mockResolvedValue({id:'r1'}); mocks.auth.mockResolvedValue({success:true,userId:'admin'}); });
describe('waitlist access and consent', () => {
 it('saves direct interest without granting access, and never overwrites previous consent', async () => {
  expect((await POST(req(payload))).status).toBe(200);
  expect(mocks.db.accessRequest.upsert).toHaveBeenCalledWith(expect.objectContaining({where:{email:'person@example.com'},update:{},create:expect.objectContaining({paidReviewInterest:false,referrerId:null})}));
 });
 it('requires contact permission and a valid role',async()=>{
  expect((await POST(req({...payload,contactConsent:false}))).status).toBe(400);
  expect((await POST(req({...payload,role:'made up'}))).status).toBe(400);
  expect(mocks.db.accessRequest.upsert).not.toHaveBeenCalled();
 });
 it('rejects cross site submissions',async()=>{expect((await POST(req(payload,'/api/join','https://other.test'))).status).toBe(403);});
 it('checks referrer membership on submission',async()=>{
  mocks.db.user.findUnique.mockResolvedValue({id:'m1',verificationStatus:'Approved',userRole:'operator',isSuspended:true});
  expect((await POST(req({...payload,code:'abcdefg'}))).status).toBe(400);
  mocks.db.user.findUnique.mockResolvedValue({id:'m1',verificationStatus:'Approved',userRole:'operator',isSuspended:false});
  expect((await POST(req({...payload,code:'abcdefg',paidReviewInterest:true}))).status).toBe(200);
  expect(mocks.db.accessRequest.upsert).toHaveBeenCalledWith(expect.objectContaining({create:expect.objectContaining({referrerId:'m1',paidReviewInterest:true})}));
 });
 it('fails closed on storage errors and rate limits',async()=>{
  mocks.limit.mockResolvedValueOnce({allowed:false,retryAfter:60});expect((await POST(req(payload))).status).toBe(429);
  mocks.db.accessRequest.upsert.mockRejectedValueOnce(new Error('database unavailable'));expect((await POST(req(payload))).status).toBe(503);
 });
 it('does not expose waitlist or CSV without admin authorization',async()=>{
  mocks.auth.mockResolvedValue({success:false,statusCode:403,error:'Forbidden'});
  expect((await GET(new NextRequest('https://btp.test/api/admin/waitlist?format=csv'))).status).toBe(403);
 });
 it('does not invite an unverified direct request or inactive referral',async()=>{
  mocks.db.accessRequest.findUnique.mockResolvedValue({id:'r',email:'p@example.com',referrerId:null,professionalVerifiedAt:null,status:'requested'});
  expect((await PATCH(req({id:'r',action:'invite'},'/api/admin/waitlist','https://btp.test','PATCH'))).status).toBe(409);
  mocks.db.accessRequest.findUnique.mockResolvedValue({id:'r',referrerId:'m',professionalVerifiedAt:null});
  mocks.db.user.findUnique.mockResolvedValue({id:'m',verificationStatus:'Pending',userRole:'operator'});
  expect((await PATCH(req({id:'r',action:'invite'},'/api/admin/waitlist','https://btp.test','PATCH'))).status).toBe(409);
 });
 it('requires a verification record',async()=>{
  mocks.db.accessRequest.findUnique.mockResolvedValue({id:'r'});
  expect((await PATCH(req({id:'r',action:'verify',note:''},'/api/admin/waitlist','https://btp.test','PATCH'))).status).toBe(400);
 });
 it('escapes spreadsheet formulas and quotes in CSV exports',()=>{
  expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
 });
});

describe('founder waiting list separation', () => {
 it('saves founder interest without reviewer opt-in or referral membership', async () => {
  expect((await POST(req({...payload,role:FOUNDER_WAITLIST_ROLE,paidReviewInterest:true,code:'abcdefg',source:'sinclair'}))).status).toBe(200);
  expect(mocks.db.accessRequest.upsert).toHaveBeenCalledWith(expect.objectContaining({update:{},create:expect.objectContaining({role:FOUNDER_WAITLIST_ROLE,paidReviewInterest:false,referrerId:null,source:'sinclair'})}));
  expect(mocks.db.user.findUnique).not.toHaveBeenCalled();
 });
 it('requires founder contact consent', async () => {
  expect((await POST(req({...payload,role:FOUNDER_WAITLIST_ROLE,contactConsent:false}))).status).toBe(400);
  expect(mocks.db.accessRequest.upsert).not.toHaveBeenCalled();
 });
 it('blocks founder verification and membership invitations even if verification was set', async () => {
  mocks.db.accessRequest.findUnique.mockResolvedValue({id:'f',role:FOUNDER_WAITLIST_ROLE,professionalVerifiedAt:new Date()});
  for (const action of ['verify','invite']) expect((await PATCH(req({id:'f',action,note:'checked experience'},'/api/admin/waitlist','https://btp.test','PATCH'))).status).toBe(409);
  expect(mocks.db.accessRequest.update).not.toHaveBeenCalled();
 });
});
