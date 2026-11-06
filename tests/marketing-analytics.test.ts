import { beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({init:vi.fn(),capture:vi.fn()}));
vi.mock('posthog-js',()=>({default:mock}));
import {marketingEvent,permitAnalytics} from '@/lib/marketing-analytics';
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubGlobal('window',{});vi.stubGlobal('location',{hostname:'behindtheprotocol.ai',pathname:'/join',href:'https://behindtheprotocol.ai/join?email=private@example.com&ref=secret&utm_source=linkedin'});
 vi.stubGlobal('document',{cookie:'',referrer:'https://linkedin.com/feed?token=private'});vi.stubGlobal('navigator',{doNotTrack:'0'});vi.stubGlobal('sessionStorage',{getItem:()=>null,setItem:vi.fn()});permitAnalytics(true);
});
it('captures only approved fields and sanitizes SDK defaults before transmission',async()=>{
 await marketingEvent('founder_request','founder');
 expect(mock.capture).toHaveBeenCalledWith('founder_request',expect.objectContaining({$current_url:'https://behindtheprotocol.ai/join',utm_source:'linkedin',audience:'founder'}),expect.anything());
 expect(JSON.stringify(mock.capture.mock.calls)).not.toMatch(/secret|private@example/);
 const cfg=mock.init.mock.calls[0][1];
 expect(cfg).toMatchObject({cookieless_mode:'always',person_profiles:'never',autocapture:false,disable_session_recording:true,capture_pageview:false});
 const sanitized=cfg.before_send({event:'founder_request',properties:{token:'public',distinct_id:'$posthog_cookieless',$cookieless_mode:true,$current_url:'https://behindtheprotocol.ai/join',$initial_current_url:'https://behindtheprotocol.ai/?token=secret',$set:{email:'private@example.com'}}});
 expect(sanitized.properties).toEqual({token:'public',distinct_id:'$posthog_cookieless',$cookieless_mode:true,$current_url:'https://behindtheprotocol.ai/join'});
 expect(cfg.before_send({event:'$autocapture',properties:{}})).toBeNull();
});
it('excludes internal browsers, preview hosts and private pages',async()=>{
 for(const [hostname,pathname,cookie] of [['behindtheprotocol.ai','/join','btp_internal=1'],['localhost','/join',''],['preview.vercel.app','/join',''],['behindtheprotocol.ai','/investors','']]){
  vi.stubGlobal('location',{hostname,pathname,href:'https://'+hostname+pathname});vi.stubGlobal('document',{cookie,referrer:''});await marketingEvent('$pageview');
 }
 expect(mock.capture).not.toHaveBeenCalled();
});
