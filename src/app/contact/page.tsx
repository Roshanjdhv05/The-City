'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@thecity.example';
export default function Contact() {
  const [name, setName] = useState(''), [from, setFrom] = useState(''), [msg, setMsg] = useState('');
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent('THE CITY enquiry from ' + (name || 'a visitor'))}&body=${encodeURIComponent(msg + '\n\n— ' + name + (from ? ' (' + from + ')' : ''))}`;
  return (
    <div className="page light"><Nav />
      <div className="wrap narrow-text">
        <span className="eyebrow" style={{ color: '#0e7490' }}>Contact</span><h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Talk to us</h1>
        <p>Questions about plots, partnerships or your storefront? Send a message and it opens in your email app addressed to <b>{EMAIL}</b>.</p>
        <div className="panel" style={{ background: '#fff', borderColor: '#dbe5f1', color: '#0b1b33' }}>
          <label style={{ color: '#53668a' }}>Your name<input style={{ background: '#f5f8fd', color: '#0b1b33', borderColor: '#cfdaea' }} value={name} onChange={e => setName(e.target.value)} /></label>
          <label style={{ color: '#53668a' }}>Your email<input type="email" style={{ background: '#f5f8fd', color: '#0b1b33', borderColor: '#cfdaea' }} value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label style={{ color: '#53668a' }}>Message<textarea rows={5} style={{ background: '#f5f8fd', color: '#0b1b33', borderColor: '#cfdaea' }} value={msg} onChange={e => setMsg(e.target.value)} /></label>
          <a className="btn" href={href} aria-disabled={!msg.trim()} style={msg.trim() ? undefined : { opacity: .45, pointerEvents: 'none' }}>Open in email app</a>
          <p className="note">Set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> in <code>.env.local</code> to your real address.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
