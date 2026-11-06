import { acquisitionConversion } from '@/lib/acquisition-server';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activeReferrer } from '@/lib/waitlist';
import { parseSignup } from '@/lib/signup';
import { attachSession,ensureReferralCode,growthHeaders,issueToken,sendReturnEmail } from '@/lib/waitlist-growth';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
export async function growthSignup(req:NextRequest,data:NonNullable<ReturnType<typeof parseSignup>>){
 const waitlistRef=data.code.startsWith('wl_')?await prisma.accessRequest.findUnique({where:{referralCode:data.code}}):null;
 const memberRef=data.code&&!waitlistRef?await activeReferrer(data.code):null;
 if(data.code&&(!waitlistRef&&!memberRef||waitlistRef?.role===FOUNDER_WAITLIST_ROLE))return NextResponse.json({error:'This referral link is not active. Join directly at /join.'},{status:400,headers:growthHeaders});
 const newId=randomUUID();
 const saveRequest=()=>prisma.$transaction(async tx=>{
  const old=await tx.accessRequest.findUnique({where:{email:data.email}});
  if(old?.role===FOUNDER_WAITLIST_ROLE){
   await tx.companyInquiry.upsert({where:{id:'legacy-'+old.id},update:{},create:{id:'legacy-'+old.id,email:old.email,name:'',company:'',website:'',product:'Product review interest (earlier waiting list)',goals:'',access:'not_yet',source:old.source,createdAt:old.createdAt}});
   await tx.requestFollowUp.upsert({where:{key:'professional:'+old.id},update:{},create:{key:'professional:'+old.id,source:data.source}});
   // Only the email owner may edit the existing record after following their private return link.
   return tx.accessRequest.update({where:{id:old.id},data:{role:data.role,paidReviewInterest:data.paidReviewInterest,status:'requested',professionalVerifiedAt:null,professionalVerifiedBy:null,verificationNote:null,invitedAt:null,joinedAt:null}});
  }
  const member=await tx.user.findFirst({where:{email:data.email},select:{id:true}});
  const entry=await tx.accessRequest.upsert({where:{email:data.email},update:{},create:{id:newId,email:data.email,role:data.role,paidReviewInterest:data.paidReviewInterest,source:memberRef||waitlistRef?'referral':data.source,referrerId:memberRef?.id??null,waitlistReferrerId:!member&&waitlistRef&&waitlistRef.email!==data.email?waitlistRef.id:null}});
  await tx.requestFollowUp.upsert({where:{key:'professional:'+entry.id},update:{},create:{key:'professional:'+entry.id,source:data.source,referrerId:memberRef?.id??null}});
  return entry;
 });
 let row;
 try { row=await saveRequest(); } catch(error) {
  // A competing signup can win the unique email insert. Retry the whole transaction
  // and return the existing record without giving this browser its private session.
  if(!(error instanceof Prisma.PrismaClientKnownRequestError)||error.code!=='P2002')throw error;
  row=await saveRequest();
 }
 // Never disclose or attach a browser session to an existing person's submitted email.
 if(row.id!==newId){await sendReturnEmail(row.id);return NextResponse.json({success:true,checkEmail:true},{headers:growthHeaders});}
 await ensureReferralCode(row.id);
 const session=await issueToken(row.id,'session');
 const emailSent=await sendReturnEmail(row.id);
 const conversion=await acquisitionConversion('community_signup','professional:'+row.id,req.headers,data.attribution);
 return attachSession(NextResponse.json({success:true,conversion,next:'/join/experience',emailSent},{headers:growthHeaders}),session);
}
