import { prisma } from '@/lib/prisma';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
export async function requestEntries() {
 const [operators, companies, investors, followups, diligence] = await Promise.all([
  prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' } }),
  prisma.companyInquiry.findMany({ orderBy: { createdAt: 'desc' } }),
  prisma.investor.findMany({ orderBy: { createdAt: 'desc' }, select: { id:true, email:true, name:true, company:true, status:true, createdAt:true } }),
  prisma.requestFollowUp.findMany(),
  prisma.diligenceRequest.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
 ]);
 const tracking = new Map(followups.map(r => [r.key, r]));
 const rows = [
  ...operators.map(r => ({ key:'professional:'+r.id, audience:r.role === FOUNDER_WAITLIST_ROLE ? 'founder' : 'professional', name:'', email:r.email, company:'', role:r.role || '', request:r.role === FOUNDER_WAITLIST_ROLE ? 'Product review interest (earlier waiting list)' : 'Community access', paidReviewInterest:r.paidReviewInterest, source:r.source, referrerId:r.referrerId, accessStatus:r.status, createdAt:r.createdAt, manageUrl:'/admin/waitlist' })),
  ...companies.map(r => ({ key:'founder:'+r.id, audience:'founder', name:r.name, email:r.email, company:r.company, role:'', request:[r.product,r.goals && 'Wants to learn: '+r.goals,r.website && 'Website: '+r.website,r.access !== 'not_yet' && 'Available: '+r.access].filter(Boolean).join('\n'), paidReviewInterest:false, source:r.source, referrerId:null as string|null, accessStatus:r.status, createdAt:r.createdAt, manageUrl:'/admin/company-inquiries' })),
  ...investors.map(r => ({ key:'investor:'+r.id, audience:'investor', name:r.name || '', email:r.email, company:r.company || '', role:'', request:'Investor room access', paidReviewInterest:false, source:'investor room', referrerId:null as string|null, accessStatus:r.status, createdAt:r.createdAt, manageUrl:'/admin/investors' })),
  ...diligence.map(r => ({ key:'diligence:'+r.id, audience:'investor', name:r.name, email:r.email, company:r.company, role:'', request:['Data room request: '+(r.sections || 'no sections selected'), r.note].filter(Boolean).join('\n'), paidReviewInterest:false, source:'data room', referrerId:null as string|null, accessStatus:'new', createdAt:r.createdAt, manageUrl:'/admin/investors' })),
 ];
 const ids = [...new Set(rows.flatMap(r => {const id = r.referrerId || tracking.get(r.key)?.referrerId;return id ? [id] : [];}))];
 const referrers = ids.length ? await prisma.user.findMany({ where:{id:{in:ids}}, select:{id:true,email:true} }) : [];
 const refs = new Map(referrers.map(r=>[r.id,r.email]));
 return rows.map(r => { const t=tracking.get(r.key); const ref=r.referrerId || t?.referrerId;
  return { ...r, source:t?.source || r.source, referral:ref ? refs.get(ref) || ref : '', status:t?.status || (r.accessStatus === 'closed' ? 'closed' : r.accessStatus === 'in_discussion' ? 'in_discussion' : 'new'), notes:t?.notes || '' };
 }).sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
}
export type RequestEntry = Awaited<ReturnType<typeof requestEntries>>[number];
