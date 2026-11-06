import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { SITE_URL } from '@/lib/site';
import { isApprovedMember } from '@/lib/access-policy';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
export const growthEnabled=()=>process.env.WAITLIST_GROWTH_ENABLED!=='false';
export const growthHeaders={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
export const SESSION_COOKIE='btp_waitlist';
export const digest=(s:string)=>createHash('sha256').update('btp-waitlist-v1:'+s).digest('hex');
export function validToken(s:unknown):s is string{return typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);}
export async function issueToken(requestId:string,purpose:'session'|'return'){
 const raw=randomBytes(32).toString('base64url');
 await prisma.waitlistToken.create({data:{requestId,purpose,tokenHash:digest(raw),expiresAt:new Date(Date.now()+(purpose==='return'?24:168)*3600_000)}});
 return raw;
}
export function attachSession(response:NextResponse,raw:string){response.cookies.set(SESSION_COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/waitlist',maxAge:7*86400});return response;}
export async function sessionEntry(req:NextRequest){
 const raw=req.cookies.get(SESSION_COOKIE)?.value;if(!validToken(raw))return null;
 const token=await prisma.waitlistToken.findUnique({where:{tokenHash:digest(raw)},include:{request:true}});
 return token?.purpose==='session'&&token.expiresAt>new Date()&&token.request.role!==FOUNDER_WAITLIST_ROLE?token.request:null;
}
export async function ensureReferralCode(id:string){
 await prisma.accessRequest.updateMany({where:{id,referralCode:null},data:{referralCode:'wl_'+randomBytes(9).toString('base64url')}});
 return (await prisma.accessRequest.findUniqueOrThrow({where:{id},select:{referralCode:true}})).referralCode!;
}
/** Eligibility is computed from existing verification, never from a self-reported profile. */
export async function referralOverview(){
 const rows=await prisma.accessRequest.findMany({where:{OR:[{role:null},{role:{not:FOUNDER_WAITLIST_ROLE}}]},orderBy:[{createdAt:'asc'},{id:'asc'}]});
 const ids=[...new Set(rows.flatMap(r=>r.referrerId?[r.referrerId]:[]))];
 const members=ids.length?await prisma.user.findMany({where:{id:{in:ids}},select:{id:true,userRole:true,verificationStatus:true,isSuspended:true}}):[];
 const verified=new Set(members.filter(isApprovedMember).map(m=>m.id));
 const entries=rows.map(r=>({...r,eligible:Boolean(r.professionalVerifiedAt||(r.referrerId&&verified.has(r.referrerId)))}));
 return entries.map(r=>{const referrals=entries.filter(x=>x.waitlistReferrerId===r.id&&x.id!==r.id);const qualified=referrals.filter(x=>qualifies(x));return {...r,qualifying:qualified.length,pending:referrals.filter(x=>!x.referralExcludedAt&&!qualifies(x)).length,referrals:referrals.map(x=>({id:x.id,email:x.email,eligible:x.eligible,emailConfirmed:Boolean(x.emailConfirmedAt),profileComplete:Boolean(x.experienceCompletedAt),excluded:Boolean(x.referralExcludedAt),reason:x.referralExclusionReason,qualified:qualifies(x)}))};}).sort((a,b)=>b.qualifying-a.qualifying||a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id));
}
export function qualifies(r:{experienceCompletedAt:Date|null,referralExcludedAt:Date|null}){return Boolean(r.experienceCompletedAt)&&!r.referralExcludedAt;}
/** A durable cooldown prevents duplicate submits from sending a stream of email. No secrets logged. */
export async function sendReturnEmail(id:string){
 if(process.env.VERCEL_ENV==='preview'||!process.env.RESEND_API_KEY)return false;
 try {
 const now=new Date();const claimed=await prisma.accessRequest.updateMany({where:{id,OR:[{welcomeClaimedAt:null},{welcomeClaimedAt:{lt:new Date(Date.now()-15*60_000)}}]},data:{welcomeClaimedAt:now}});
 if(!claimed.count)return false;
 const row=await prisma.accessRequest.findUniqueOrThrow({where:{id}});const token=await issueToken(id,'return');
 const ok=await sendEmail(row.email,'Your BTP waitlist access',`You’re on the BTP waitlist.\n\nOpen your private waitlist page to complete your experience profile and get your personal referral link:\n${SITE_URL}/join/return#${token}\n\nThis private link expires in 24 hours. Do not share it. Your public referral link is available after opening it.\n\nPaid product reviews are optional. Each new person who signs up through your link and completes their experience questionnaire improves your priority. BTP reviews membership separately.\n\nBehind The Protocol Inc.`);
 if(ok)await prisma.accessRequest.update({where:{id},data:{welcomeSentAt:now}});
 return ok;
 } catch {
  console.error('Waitlist return email could not be prepared');
  return false;
 }
}
