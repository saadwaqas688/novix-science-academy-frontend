'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field } from '@/components/common';
import { AuthCard, Notice } from '@/components/auth-card';

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', classLevel: '9', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/auth/signup', { json: f });
      router.push('/pending');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <AuthCard icon={UserPlus} title="Create account" text="After you sign up, the academy admin will approve your account.">
      {error && <Notice tone="bad" icon={XCircle}>{error}</Notice>}
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field label="Full name"><Input required minLength={2} value={f.name} onChange={set('name')} placeholder="e.g. Ali Raza" autoComplete="name" /></Field>
        <Field label="Email"><Input type="email" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><Input required minLength={7} value={f.phone} onChange={set('phone')} placeholder="03xx-xxxxxxx" inputMode="tel" autoComplete="tel" /></Field>
          <Field label="Class">
            <Select value={f.classLevel} onValueChange={(v) => setF({ ...f, classLevel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Password"><Input type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="new-password" /></Field>
        <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Request access</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-bold text-brand-ink">Sign in</Link></p>
    </AuthCard>
  );
}
