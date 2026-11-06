import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { campaignValue, externalReferrer, publicPath } from '@/lib/acquisition';
export function cleanAttribution(value: unknown) {
 const v = value && typeof value === 'object' ? value as Record<string,unknown> : {};
 return {source:campaignValue(v.source) || (typeof v.source==='string'?externalReferrer('https://'+v.source):undefined) || 'direct',medium:campaignValue(v.medium)??null,campaign:campaignValue(v.campaign)??null,content:campaignValue(v.content)??null,landing:typeof v.landing==='string'&&publicPath(v.landing)?v.landing:'/join'};
}
/** Stable event IDs make retries idempotent. No signup content is stored in acquisition events. */
export async function acquisitionConversion(event:string,key:string,headers:Headers,attribution:unknown) {
 try {
  if(process.env.VERCEL_ENV==='preview'||headers.get('cookie')?.split(';').some(c=>c.trim()==='btp_internal=1'))return false;
  const id=createHash('sha256').update(event+':'+key).digest('hex');
  const result=await prisma.analyticsEvent.createMany({data:[{id:'acq-'+id,anonymousUserId:'ACQ-'+id.slice(0,24),eventType:event,eventCategory:'acquisition',objectType:'request',objectId:key,createdAtBucket:new Date().toISOString().slice(0,10),metadataJson:cleanAttribution(attribution)}],skipDuplicates:true});
  return result.count===1;
 }catch{return false;}
}
