import { NextRequest,NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachSession,digest,growthEnabled,growthHeaders,issueToken,validToken } from '@/lib/waitlist-growth';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
/** Explicit user confirmation, never a GET/email scanner, confirms an email and exchanges the return token. */
export async function POST(req:NextRequest){
 if(!growthEnabled())return NextResponse.json({error:'Not available.'},{status:404});
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
 const raw=await req.text();if(raw.length>1024)return NextResponse.json({error:'Invalid request.'},{status:400});
 let b;try{b=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
 if(!validToken(b?.token))return NextResponse.json({error:'This link is invalid or expired.'},{status:401,headers:growthHeaders});
 const row=await prisma.$transaction(async tx=>{
  const token=await tx.waitlistToken.findUnique({where:{tokenHash:digest(b.token)},include:{request:true}});
  if(!token||token.purpose!=='return'||token.expiresAt<=new Date())return null;
  const used=await tx.waitlistToken.deleteMany({where:{id:token.id,purpose:'return',expiresAt:{gt:new Date()}}});if(!used.count)return null;
  // A legacy founder waitlist entry may become an operator only through a new community signup,
  // not merely by confirming an email. Keep that path separate.
  if(token.request.role===FOUNDER_WAITLIST_ROLE)return null;
  await tx.accessRequest.update({where:{id:token.requestId},data:{emailConfirmedAt:token.request.emailConfirmedAt??new Date()}});
  return token.request;
 });
 if(!row)return NextResponse.json({error:'This link is invalid or expired. Request a new one.'},{status:401,headers:growthHeaders});
 const session=await issueToken(row.id,'session');
 return attachSession(NextResponse.json({success:true},{headers:growthHeaders}),session);
}
