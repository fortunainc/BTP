/** Real database dummy flow. Refuses any database except the isolated loopback fixture. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
async function main(){
 const url=new URL(process.env.DATABASE_URL||'');
 assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55435');assert.equal(url.pathname,'/btp_growth_test');
 process.env.RESEND_API_KEY='';process.env.WAITLIST_GROWTH_ENABLED='true';
 const {prisma}=await import('../lib/prisma');const {POST:signup}=await import('../app/api/interest/route');
 const {GET:profile,PUT:save}=await import('../app/api/waitlist/profile/route');const {POST:exchange}=await import('../app/api/waitlist/session/route');
 const {issueToken,referralOverview,digest}=await import('../lib/waitlist-growth');
 const base='http://localhost:3000';const run=randomUUID().slice(0,8);let count=0;
 const ok=(name:string)=>{count++;console.log('PASS '+name)};
 function request(path:string,method='GET',body?:unknown,cookie?:string){return new NextRequest(base+path,{method,headers:{origin:base,'content-type':'application/json','x-forwarded-for':'test-'+run,...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})}
 async function join(email:string,code=''){return signup(request('/api/interest','POST',{audience:'professional',email,role:'Sponsor',contactConsent:true,code}))}
 function cookie(r:Response){const c=r.headers.get('set-cookie');assert(c);return c.split(';')[0]}
 const aEmail=`a-${run}@example.com`,bEmail=`b-${run}@example.com`;
 const a=await join(aEmail);assert.equal(a.status,200);const ac=cookie(a);assert.equal((await a.json()).next,'/join/experience');ok('new signup gets a private browser session');
 const ap=await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json();const code=new URL(ap.link).searchParams.get('ref');assert(code?.startsWith('wl_'));assert.equal(ap.qualifying,0);ok('one stable public referral link');
 assert.equal((await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json()).link,ap.link);
 const b=await join(bEmail,code!);assert.equal(b.status,200);const bc=cookie(b);let progress=await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json();assert.equal(progress.signedUp,1);assert.equal(progress.pending,1);assert.equal(progress.qualifying,0);ok('referred signup is pending before questionnaire');
 const answers={version:1,settings:['site'],years:'four_seven',work:[{area:'recruitment',involvement:'performed',recency:'current'}],products:['irt','ai_agents'],productNames:'Dummy product',areas:['oncology'],paidReviewInterest:true};
 assert.equal((await save(request('/api/waitlist/profile','PUT',{...answers,areas:[]},bc))).status,400);ok('required therapeutic experience enforced');
 assert.equal((await save(request('/api/waitlist/profile','PUT',{...answers,requestId:'another-person'},bc))).status,400);ok('profile cannot target a different person');
 assert.equal((await save(request('/api/waitlist/profile','PUT',answers,bc))).status,200);
 const br=await prisma.accessRequest.findUniqueOrThrow({where:{email:bEmail}});assert.equal(br.emailConfirmedAt,null);assert.equal(br.professionalVerifiedAt,null);assert.equal(br.status,'requested');assert(br.experienceCompletedAt);assert.equal(br.paidReviewInterest,true);
 progress=await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json();assert.equal(progress.qualifying,1);assert.equal(progress.pending,0);assert(!JSON.stringify(progress).includes(bEmail));ok('questionnaire adds credit without email or professional verification and exposes no referred email');
 await save(request('/api/waitlist/profile','PUT',answers,bc));assert.equal((await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json()).qualifying,1);ok('editing completed questionnaire never double credits');
 const repeat=await join(bEmail,code!);assert.equal(repeat.status,200);assert.equal(repeat.headers.get('set-cookie'),null);assert.equal((await repeat.json()).checkEmail,true);ok('existing email cannot claim another person’s browser session');
 const self=await join(aEmail,code!);assert.equal(self.headers.get('set-cookie'),null);assert.equal((await prisma.accessRequest.findUniqueOrThrow({where:{email:aEmail}})).waitlistReferrerId,null);ok('self referral does not count');
 const raceEmail=`race-${run}@example.com`;const races=await Promise.all([join(raceEmail,code!),join(raceEmail,code!)]);assert(races.every(r=>r.status===200));assert.equal(races.filter(r=>r.headers.get('set-cookie')).length,1);assert.equal(await prisma.accessRequest.count({where:{email:raceEmail}}),1);ok('concurrent signup retries create one request and one owner session');
 assert.equal((await profile(request('/api/waitlist/profile'))).status,401);assert.equal((await profile(request('/api/waitlist/profile','GET',undefined,'btp_waitlist='+code))).status,401);ok('public referral link is not private profile authorization');
 const token=await issueToken(br.id,'return');const opened=await exchange(request('/api/waitlist/session','POST',{token}));assert.equal(opened.status,200);assert.equal((await exchange(request('/api/waitlist/session','POST',{token}))).status,401);ok('private return link works once and rejects replay');
 const expired=await issueToken(br.id,'return');await prisma.waitlistToken.update({where:{tokenHash:digest(expired)},data:{expiresAt:new Date(0)}});assert.equal((await exchange(request('/api/waitlist/session','POST',{token:expired}))).status,401);ok('expired private link rejected');
 const foreign=new NextRequest(base+'/api/waitlist/profile',{method:'PUT',headers:{origin:'https://other.example',cookie:bc},body:JSON.stringify(answers)});assert.equal((await save(foreign)).status,403);ok('cross-origin profile writes rejected');
 await prisma.accessRequest.update({where:{id:br.id},data:{referralExcludedAt:new Date(),referralExclusionReason:'Dummy duplicate test'}});assert.equal((await (await profile(request('/api/waitlist/profile','GET',undefined,ac))).json()).qualifying,0);await prisma.accessRequest.update({where:{id:br.id},data:{referralExcludedAt:null,referralExclusionReason:null}});ok('admin exclusion removes credit without changing membership');
 for(const audience of ['founder','investor']){const r=await signup(request('/api/interest','POST',{audience,email:`${audience}-${run}@example.com`,name:'Dummy',company:'Dummy company',request:'Dummy product review',contactConsent:true}));assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null)}ok('founder and investor signup paths stay separate');
 const all=await referralOverview();assert(all.find(r=>r.email===aEmail)?.qualifying===1);ok('admin overview agrees with public referral count');
 console.log(`${count} dummy integration checks passed; isolated database only; no emails sent.`);
 await prisma.$disconnect();
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
