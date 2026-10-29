'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, GraduationCap, Loader2, Lock, XCircle } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common';
import { AuthCard, Notice } from '@/components/auth-card';

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'info' | 'warn' | 'bad'; text: string } | null>(null);
  const [next, setNext] = useState('');

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next') || '';
    setNext(n.startsWith('/') ? n : '');
    if (n) setNotice({ tone: 'info', text: 'Please sign in to continue.' });
  }, []);
  useEffect(() => { if (ready && user) router.replace(next || (user.role === 'admin' ? '/admin' : '/')); }, [ready, user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice(null);
    try {
      const u = await login(email, password);
      router.replace(next || (u.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setNotice({ tone: code === 'PENDING' ? 'warn' : 'bad', text: (err as Error).message });
    } finally { setBusy(false); }
  }

  const icon = notice?.tone === 'warn' ? Clock : notice?.tone === 'bad' ? XCircle : Lock;
  return (
    <AuthCard icon={GraduationCap} title="Welcome back" text="Sign in to open courses, notes, videos and tests.">
      {notice && <Notice tone={notice.tone} icon={icon}>{notice.text}</Notice>}
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field label="Email"><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Sign in</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">New here? <Link href="/signup" className="font-bold text-brand-ink">Create an account</Link></p>
    </AuthCard>
  );
}
