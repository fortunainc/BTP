'use client';
import { useEffect } from 'react';

/** Progressive reveal for elements marked data-reveal, data-tl or .tl-step. Content stays visible without JS or with reduced motion. */
export default function SectionReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('anim');
    const els = document.querySelectorAll('[data-reveal],[data-tl],.tl-step');
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    const t = window.setTimeout(() => els.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); }), 50);
    return () => { io.disconnect(); window.clearTimeout(t); root.classList.remove('anim'); };
  }, []);
  return null;
}
