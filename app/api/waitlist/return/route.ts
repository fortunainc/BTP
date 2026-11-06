import { createHash } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { normalizeEmail } from '@/lib/work-email';
import { growthEnabled,growthHeaders,sendReturnEmail } from '@/lib/waitlist-growth';
export async function POST(req:NextRequest){
 if(!growthEnabled())return NextResponse.json({error:'Not available.'},{status:404});
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
 const key=createHash('sha256').update('waitlist-return:'+(req.headers.get('x-forwarded-for')||'unknown')).digest('hex');
 const rate=await checkWriteRateLimit(key,'/api/waitlist/return');if(!rate.allowed)return NextResponse.json({error:'Please try again later.'},{status:429,headers:growthHeaders});
 const raw=await req.text();if(raw.length>1024)return NextResponse.json({error:'Invalid request.'},{status:400});
 let b;try{b=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
 const email=normalizeEmail(b?.email);if(!email)return NextResponse.json({error:'Enter your email.'},{status:400});
 const row=await prisma.accessRequest.findUnique({where:{email}});if(row)await sendReturnEmail(row.id);
 return NextResponse.json({success:true,message:'If you have a request on file, a private link will arrive shortly. Please check spam too.'},{headers:growthHeaders});
}
