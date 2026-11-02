import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m=vi.hoisted(()=>({
 db:{accessRequest:{findUnique:vi.fn(),upsert:vi.fn(),update:vi.fn(),findMany:vi.fn()},companyInquiry:{upsert:vi.fn(),findUnique:vi.fn(),findMany:vi.fn()},investor:{upsert:vi.fn(),findUnique:vi.fn(),findMany:vi.fn()},requestFollowUp:{upsert:vi.fn(),findMany:vi.fn()},user:{findMany:vi.fn(),findUnique:vi.fn()},$transaction:vi.fn()},auth:vi.fn(),limit:vi.fn(),
}));
vi.mock('@/lib/prisma',()=>({prisma:m.db}));
vi.mock('@/lib/admin-auth',()=>({verifyAdminAccess:m.auth}));
vi.mock('@/lib/write-rate-limit',()=>({checkWriteRateLimit:m.limit}));
import { POST } from '@/app/api/interest/route';
import { GET, PATCH } from '@/app/api/admin/requests/route';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
const payload={audience:'professional',email:' Person@Example.com ',role:'Coordinator',contactConsent:true};
function req(body:unknown,path='/api/interest',method='POST',origin='https://btp.test'){return new NextRequest('https://btp.test'+path,{method,headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});}
beforeEach(()=>{
 vi.resetAllMocks();m.limit.mockResolvedValue({allowed:true,retryAfter:60});m.auth.mockResolvedValue({success:true});
 m.db.$transaction.mockImplementation(fn=>fn(m.db));
 for(const model of [m.db.accessRequest,m.db.companyInquiry,m.db.investor]){model.upsert.mockResolvedValue({id:'r1'});model.findMany.mockResolvedValue([]);}
 m.db.requestFollowUp.findMany.mockResolvedValue([]);
});
describe('short signup',()=>{
 it('saves operator interest and only records contact permission, not approval',async()=>{
  expect((await POST(req({...payload,paidReviewInterest:true}))).status).toBe(200);
  expect(m.db.accessRequest.upsert).toHaveBeenCalledWith(expect.objectContaining({where:{email:'person@example.com'},update:{},create:expect.objectContaining({role:'Coordinator',paidReviewInterest:true})}));
  expect(m.db.investor.upsert).not.toHaveBeenCalled();
 });
 it('keeps product requests separate from membership and retries idempotent',async()=>{
  const b={...payload,audience:'founder',name:'Pat',company:'Example',request:'Feedback on recruitment workflows'};
  expect((await POST(req(b))).status).toBe(200);expect((await POST(req(b))).status).toBe(200);
  const calls=m.db.companyInquiry.upsert.mock.calls;
  expect(calls[0][0].where.id).toBe(calls[1][0].where.id);
  expect(calls[0][0].update).toEqual({});expect(calls[0][0].create.product).toBe(b.request);
  expect(m.db.accessRequest.upsert).not.toHaveBeenCalled();
 });
 it('registers investors pending and does not overwrite approved or revoked access',async()=>{
  expect((await POST(req({...payload,audience:'investor',name:'Pat'}))).status).toBe(200);
  expect(m.db.investor.upsert).toHaveBeenCalledWith({where:{email:'person@example.com'},update:{},create:{email:'person@example.com',name:'Pat',company:null,status:'pending'}});
 });
 it('allows the same email for all three purposes',async()=>{
  for(const b of [payload,{...payload,audience:'founder',name:'Pat',company:'Test',request:'Review our demo'},{...payload,audience:'investor',name:'Pat'}])expect((await POST(req(b))).status).toBe(200);
  expect(m.db.requestFollowUp.upsert.mock.calls.map(c=>c[0].where.key)).toEqual(['professional:r1','founder:r1','investor:r1']);
 });
 it('preserves legacy founder interest when they now request community access',async()=>{
  m.db.accessRequest.findUnique.mockResolvedValue({id:'old',email:'person@example.com',role:FOUNDER_WAITLIST_ROLE,source:'linkedin',createdAt:new Date()});
  expect((await POST(req(payload))).status).toBe(200);
  expect(m.db.companyInquiry.upsert).toHaveBeenCalledWith(expect.objectContaining({where:{id:'legacy-old'},create:expect.objectContaining({source:'linkedin'})}));
  expect(m.db.accessRequest.update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({role:'Coordinator',status:'requested',professionalVerifiedAt:null})}));
 });
 it('rejects missing details and consent without writes',async()=>{
  for(const b of [{...payload,contactConsent:false},{...payload,role:'CEO'},{...payload,audience:'investor'},{...payload,audience:'founder',name:'Pat',company:'Test'}])expect((await POST(req(b))).status).toBe(400);
  expect(m.db.$transaction).not.toHaveBeenCalled();
 });
 it('requires active referrals and captures them for company requests',async()=>{
  const b={...payload,audience:'founder',name:'Pat',company:'Test',request:'Demo feedback',code:'abcdefg'};
  expect((await POST(req(b))).status).toBe(400);
  m.db.user.findUnique.mockResolvedValue({id:'member',verificationStatus:'Approved',userRole:'operator',isSuspended:false});
  expect((await POST(req(b))).status).toBe(200);
  expect(m.db.requestFollowUp.upsert).toHaveBeenCalledWith(expect.objectContaining({create:expect.objectContaining({referrerId:'member'})}));
 });
 it('rejects cross origin, rate limits, and fails honestly on database errors',async()=>{
  expect((await POST(req(payload,'/api/interest','POST','https://other.test'))).status).toBe(403);
  m.limit.mockResolvedValueOnce({allowed:false,retryAfter:60});expect((await POST(req(payload))).status).toBe(429);
  m.db.$transaction.mockRejectedValueOnce(new Error('offline'));expect((await POST(req(payload))).status).toBe(503);
 });
});
describe('private request dashboard',()=>{
 it('protects details, exports, and updates',async()=>{
  m.auth.mockResolvedValue({success:false,statusCode:403,error:'Forbidden'});
  expect((await GET(new NextRequest('https://btp.test/api/admin/requests?format=csv'))).status).toBe(403);
  expect((await PATCH(req({key:'investor:r1',status:'contacted',notes:''},'/api/admin/requests','PATCH'))).status).toBe(403);
  expect(m.db.investor.findMany).not.toHaveBeenCalled();
 });
 it('updates notes and follow up without changing access',async()=>{
  m.db.investor.findUnique.mockResolvedValue({id:'r1'});
  expect((await PATCH(req({key:'investor:r1',status:'contacted',notes:'Schedule a call'},'/api/admin/requests','PATCH'))).status).toBe(200);
  expect(m.db.requestFollowUp.upsert).toHaveBeenCalledWith(expect.objectContaining({update:{status:'contacted',notes:'Schedule a call'}}));
  expect(m.db.investor.upsert).not.toHaveBeenCalled();
 });
 it('merges legacy records and new interests, preserving separate purposes and safe CSV',async()=>{
  const base={id:'r1',email:'p@example.com',createdAt:new Date('2026-11-01')};
  m.db.accessRequest.findMany.mockResolvedValue([{...base,role:'Coordinator',source:'linkedin',paidReviewInterest:true,status:'requested'}]);
  m.db.investor.findMany.mockResolvedValue([{...base,name:'=formula',company:'Firm',status:'pending'}]);
  m.db.requestFollowUp.findMany.mockResolvedValue([{key:'investor:r1',status:'contacted',notes:'Private',source:'referral'}]);
  const res=await GET(new NextRequest('https://btp.test/api/admin/requests'));const body=await res.json();
  expect(body.entries).toHaveLength(2);expect(body.entries[1]).toMatchObject({audience:'investor',notes:'Private',status:'contacted'});
  const csv=await (await GET(new NextRequest('https://btp.test/api/admin/requests?format=csv'))).text();expect(csv).toContain("'=formula");
  expect(m.db.investor.findMany).toHaveBeenCalledWith(expect.objectContaining({select:expect.not.objectContaining({tokenHash:true})}));
 });
});
