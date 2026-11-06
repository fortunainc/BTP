'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import '../experience/growth.css';
export default function ReturnLink(){
 const [token,setToken]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setToken(window.location.hash.slice(1));window.history.replaceState(null,'',window.location.pathname);},[]);
 async function open(){setBusy(true);try{const r=await fetch('/api/waitlist/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const b=await r.json();if(!r.ok)throw Error(b.error);window.location.assign('/join/experience');}catch(e){setMessage(e instanceof Error?e.message:'Could not open this link.');setBusy(false)}}
 return <main className="growth"><div className="gr-return"><Link className="gr-mark" href="/">BTP</Link><p className="gr-eyebrow">Your private access</p><h1>Your experience<br/><em>belongs here.</em></h1><p>Continue to your experience profile and personal referral link.</p>{token&&!message&&<button className="gr-gold" disabled={busy} onClick={()=>void open()}>{busy?'Opening…':'Continue →'}</button>}<p role="alert">{message}</p>{(!token||message)&&<Link href="/join/experience">Request a new private link →</Link>}<p className="gr-small">This link opens only your waitlist profile. Community access is approved separately.</p></div></main>;
}
