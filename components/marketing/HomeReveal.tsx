'use client';
import { useEffect } from 'react';

/** Fades sections in as they scroll into view. `scope` is the page wrapper class (homepage .bh, investor room .ir). */
export default function HomeReveal({ scope = '.bh' }: { scope?: string }) {
  useEffect(() => {
    const els = document.querySelectorAll(`${scope} .reveal`);
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scope]);
  return null;
}
