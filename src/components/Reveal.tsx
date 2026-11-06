'use client';
import { useEffect, useRef, useState } from 'react';
/** Fades/slides children in once when scrolled into view. */
export default function Reveal({ children, delay = 0, className = '', as: T = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: any }) {
  const ref = useRef<HTMLElement>(null), [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <T ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ ['--d' as any]: `${delay}s` }}>{children}</T>;
}
