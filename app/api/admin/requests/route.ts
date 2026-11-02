import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { csvCell } from '@/lib/waitlist';
import { requestEntries } from '@/lib/request-entries';
import { FOLLOW_UP_STATUSES } from '@/lib/signup';
const headers = { 'Cache-Control':'private, no-store' };
export async function GET(req:NextRequest) {
 const admin=await verifyAdminAccess(req);
 if(!admin.success) return NextResponse.json({error:admin.error},{status:admin.statusCode || 403,headers});
 try {
  const rows=await requestEntries();
  if(req.nextUrl.searchParams.get('format') === 'csv') {
   const fields=['Purpose','Name','Email','Company or firm','Role','Request','Paid review interest','Source','Referred by','Received','Follow up','Access or inquiry status','Notes'];
   const csv=[fields,...rows.map(r=>[r.audience,r.name,r.email,r.company,r.role,r.request,r.paidReviewInterest?'Yes':'No',r.source,r.referral,r.createdAt.toISOString(),r.status,r.accessStatus,r.notes])].map(r=>r.map(csvCell).join(',')).join('\r\n');
   return new NextResponse(csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="btp-requests.csv"'}});
  }
  return NextResponse.json({entries:rows},{headers});
 } catch {return NextResponse.json({error:'Could not load requests. Please try again.'},{status:503,headers});}
}
export async function PATCH(req:NextRequest) {
 const admin=await verifyAdminAccess(req);
 if(!admin.success) return NextResponse.json({error:admin.error},{status:admin.statusCode || 403,headers});
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid request origin.'},{status:403,headers});
 const text=await req.text();if(text.length>12000)return NextResponse.json({error:'Notes are too long.'},{status:413,headers});
 let b;try {b=JSON.parse(text);}catch{return NextResponse.json({error:'Invalid request.'},{status:400,headers});}
 if(!b || typeof b.key!=='string'||!FOLLOW_UP_STATUSES.includes(b.status)||typeof b.notes!=='string'||b.notes.length>4000)return NextResponse.json({error:'Choose a status and keep notes under 4,000 characters.'},{status:400,headers});
 const [kind,id,...rest]=b.key.split(':');
 if(!id||rest.length||!['professional','founder','investor'].includes(kind))return NextResponse.json({error:'Request not found.'},{status:404,headers});
 try {
  const exists=kind==='professional'?await prisma.accessRequest.findUnique({where:{id},select:{id:true}}):kind==='founder'?await prisma.companyInquiry.findUnique({where:{id},select:{id:true}}):await prisma.investor.findUnique({where:{id},select:{id:true}});
  if(!exists)return NextResponse.json({error:'Request not found.'},{status:404,headers});
  await prisma.requestFollowUp.upsert({where:{key:b.key},update:{status:b.status,notes:b.notes},create:{key:b.key,status:b.status,notes:b.notes}});
  return NextResponse.json({success:true},{headers});
 }catch{return NextResponse.json({error:'Could not save. Please try again.'},{status:503,headers});}
}
