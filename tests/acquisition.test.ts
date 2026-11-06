import { describe, expect, it, vi, beforeEach } from 'vitest';
import { attributionFrom, campaignValue, externalReferrer, publicPath } from '@/lib/acquisition';
import sitemap from '@/app/sitemap';
const db=vi.hoisted(()=>({analyticsEvent:{createMany:vi.fn()}}));
vi.mock('@/lib/prisma',()=>({prisma:db}));
import { acquisitionConversion, cleanAttribution } from '@/lib/acquisition-server';
beforeEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();db.analyticsEvent.createMany.mockResolvedValue({count:1});});
describe('public analytics boundaries',()=>{
 it('excludes member, investor and private return URL paths',()=>{
  for(const p of ['/investors','/investors/room','/admin/traffic','/situations','/join/return','/join/experience'])expect(publicPath(p)).toBe(false);
  expect(sitemap().map(x=>x.url)).toEqual(['https://behindtheprotocol.ai/','https://behindtheprotocol.ai/companies','https://behindtheprotocol.ai/join','https://behindtheprotocol.ai/privacy','https://behindtheprotocol.ai/support']);
 });
 it('retains only campaign labels, never private query or referral codes',()=>{
  const a=attributionFrom('https://behindtheprotocol.ai/join?utm_source=linkedin&utm_campaign=founder_launch&ref=private&email=a@b.com&token=secret');
  expect(a).toMatchObject({source:'linkedin',campaign:'founder_launch',landing:'/join'});
  expect(JSON.stringify(a)).not.toMatch(/private|secret|a@b/);
  expect(campaignValue('a@b.com')).toBeUndefined();expect(campaignValue('https://secret.test')).toBeUndefined();
 });
 it('does not report the BTP site as an external referrer',()=>{
  expect(externalReferrer('https://behindtheprotocol.ai/companies')).toBeUndefined();
  expect(attributionFrom('https://behindtheprotocol.ai/join?utm_source=startups','https://behindtheprotocol.ai/companies').source).toBe('direct');
  expect(attributionFrom('https://behindtheprotocol.ai/','https://linkedin.com/feed?private=abc').source).toBe('linkedin.com');
 });
 it('discards payload extras before recording attribution',()=>{
  expect(cleanAttribution({source:'linkedin',email:'secret',landing:'/investors/room',campaign:'contact@example.com'})).toEqual({source:'linkedin',medium:null,campaign:null,content:null,landing:'/join'});
 });
 it('never records internal or preview conversions',async()=>{
  expect(await acquisitionConversion('founder_request','founder:1',new Headers({cookie:'btp_internal=1'}),{})).toBe(false);
  vi.stubEnv('VERCEL_ENV','preview');expect(await acquisitionConversion('founder_request','founder:1',new Headers(),{})).toBe(false);
  expect(db.analyticsEvent.createMany).not.toHaveBeenCalled();
 });
 it('deduplicates conversion events by request and event, without signup details',async()=>{
  expect(await acquisitionConversion('founder_request','founder:1',new Headers(),{source:'linkedin',email:'private'})).toBe(true);
  db.analyticsEvent.createMany.mockResolvedValue({count:0});
  expect(await acquisitionConversion('founder_request','founder:1',new Headers(),{})).toBe(false);
  const calls=db.analyticsEvent.createMany.mock.calls;
  expect(calls[0][0].data[0].id).toBe(calls[1][0].data[0].id);
  expect(calls[0][0].skipDuplicates).toBe(true);
  expect(JSON.stringify(calls[0])).not.toContain('private');
 });
});
