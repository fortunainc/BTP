import { NextRequest,NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { growthEnabled,growthHeaders,referralOverview } from '@/lib/waitlist-growth';
import { csvCell } from '@/lib/waitlist';
export async function GET(req:NextRequest){
 const auth=await verifyAdminAccess(req);if(!auth.success)return NextResponse.json({error:auth.error},{status:auth.statusCode||403});
 if(!growthEnabled())return NextResponse.json({error:'Waitlist growth is not enabled.'},{status:404});
 const rows=await referralOverview();let rank=0;
 const entries=rows.map(r=>({id:r.id,email:r.email,role:r.role,createdAt:r.createdAt,priority:r.status==='requested'?++rank:null,status:r.status,eligible:r.eligible,paidReviewInterest:r.paidReviewInterest,profile:r.experienceProfile,completedAt:r.experienceCompletedAt,emailConfirmed:Boolean(r.emailConfirmedAt),referrer:rows.find(x=>x.id===r.waitlistReferrerId)?.email??null,qualifying:r.qualifying,pending:r.pending,referrals:r.referrals}));
 if(req.nextUrl.searchParams.get('format')==='csv'){
  const csv=[['Priority','Email','Role','Status','Email confirmed','Professional eligibility','Referrer','Qualifying referrals','Pending referrals','Paid review interest','Experience profile (versioned JSON)'],...entries.map(r=>[r.priority,r.email,r.role,r.status,r.emailConfirmed,r.eligible,r.referrer,r.qualifying,r.pending,r.paidReviewInterest,JSON.stringify(r.profile)])].map(r=>r.map(csvCell).join(',')).join('\r\n');
  return new NextResponse(csv,{headers:{...growthHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="btp-referrals-experience.csv"'}});
 }
 return NextResponse.json({entries},{headers:growthHeaders});
}
export async function PATCH(req:NextRequest){
 const auth=await verifyAdminAccess(req);if(!auth.success)return NextResponse.json({error:auth.error},{status:auth.statusCode||403});
 if(!growthEnabled())return NextResponse.json({error:'Not enabled.'},{status:404});
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
 const text=await req.text();if(text.length>2048)return NextResponse.json({error:'Request too large.'},{status:413});
 let b;try{b=JSON.parse(text)}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
 if(!b||typeof b.id!=='string'||!['exclude','restore'].includes(b.action)||typeof b.reason!=='string'||b.reason.trim().length<8||b.reason.length>300)return NextResponse.json({error:'Choose a referral and record a brief reason.'},{status:400});
 const row=await prisma.accessRequest.findUnique({where:{id:b.id}});if(!row?.waitlistReferrerId)return NextResponse.json({error:'Referral not found.'},{status:404});
 await prisma.$transaction(async tx=>{
  await tx.accessRequest.update({where:{id:row.id},data:{referralExcludedAt:b.action==='exclude'?new Date():null,referralExclusionReason:b.action==='exclude'?b.reason.trim():null}});
  await tx.waitlistReferralEvent.create({data:{requestId:row.id,actorId:auth.userId!,action:b.action,reason:b.reason.trim()}});
 });return NextResponse.json({success:true},{headers:growthHeaders});
}
