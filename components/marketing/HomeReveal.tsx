'use client';
import { useEffect } from 'react';

/** Fades homepage sections in as they scroll into view. */
export default function HomeReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.bh .reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
