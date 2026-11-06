import { acquisitionConversion } from '@/lib/acquisition-server';
import { NextRequest,NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { experienceSchema } from '@/lib/experience-profile';
import { ensureReferralCode,growthEnabled,growthHeaders,sessionEntry } from '@/lib/waitlist-growth';
import { SITE_URL } from '@/lib/site';
export async function GET(req:NextRequest){
 if(!growthEnabled())return NextResponse.json({error:'Not available.'},{status:404});
 const row=await sessionEntry(req);if(!row)return NextResponse.json({error:'Open your private email link to continue.'},{status:401,headers:growthHeaders});
 const code=await ensureReferralCode(row.id);
 const where={waitlistReferrerId:row.id,referralExcludedAt:null,id:{not:row.id}};
 const [signedUp,qualifying]=await Promise.all([prisma.accessRequest.count({where}),prisma.accessRequest.count({where:{...where,experienceCompletedAt:{not:null}}})]);
 return NextResponse.json({role:row.role,paidReviewInterest:row.paidReviewInterest,profile:row.experienceProfile,emailConfirmed:Boolean(row.emailConfirmedAt),status:row.status,link:`${SITE_URL}/join?ref=${code}`,qualifying,pending:signedUp-qualifying,signedUp},{headers:growthHeaders});
}
export async function PUT(req:NextRequest){
 if(!growthEnabled())return NextResponse.json({error:'Not available.'},{status:404});
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
 const row=await sessionEntry(req);if(!row)return NextResponse.json({error:'Open your private email link to continue.'},{status:401,headers:growthHeaders});
 const raw=await req.text();if(raw.length>12000)return NextResponse.json({error:'Profile too large.'},{status:413});
 let json;try{json=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid profile.'},{status:400})}
 const profile=experienceSchema.safeParse(json);if(!profile.success)return NextResponse.json({error:'Complete the required experience fields. Choose up to five expertise areas.'},{status:400,headers:growthHeaders});
 await prisma.accessRequest.update({where:{id:row.id},data:{experienceProfile:profile.data,experienceCompletedAt:row.experienceCompletedAt??new Date(),experienceUpdatedAt:new Date(),paidReviewInterest:profile.data.paidReviewInterest}});
 const conversion=!row.experienceCompletedAt && await acquisitionConversion('experience_completed','professional:'+row.id,req.headers,{});
 return NextResponse.json({success:true,conversion},{headers:growthHeaders});
}
