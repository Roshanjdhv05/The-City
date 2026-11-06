'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/data';
import { DEMO } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [up, setUp] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const { signIn } = useAuth(), router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await signIn(email, pw, up); router.push('/buy'); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="page dark"><Nav />
      <form className="panel narrow" onSubmit={submit}>
        <h1>{up ? 'Create your account' : 'Sign in'}</h1>
        {DEMO && <p className="note">Demo mode: any email works and data stays in this browser. Add Supabase keys to use real accounts.</p>}
        <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn wide" disabled={busy}>{up ? 'Create account' : 'Sign in'}</button>
        <button type="button" className="ghost" onClick={() => setUp(!up)}>{up ? 'I already have an account' : 'Create an account'}</button>
      </form>
      <Footer />
    </div>
  );
}
