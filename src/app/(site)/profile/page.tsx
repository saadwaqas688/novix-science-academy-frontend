'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthGate, Field } from '@/components/common';
import { Avatar } from '@/components/site-shell';

export default function ProfileRoute() {
  return <AuthGate><Profile /></AuthGate>;
}

function Profile() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const u = user!;
  const [name, setName] = useState(u.name);
  const [phone, setPhone] = useState(u.phone);
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');

  const save = useMutation({
    mutationFn: () => api<{ user: User }>('/auth/me', { method: 'PATCH', json: { name, phone, ...(pw ? { currentPassword: cur, newPassword: pw } : {}) } }),
    onSuccess: (r) => { setUser(r.user); setCur(''); setPw(''); toast.success('Profile saved'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="p-7 text-center">
        <Avatar name={u.name} className="mx-auto mb-3.5 size-20 text-3xl" />
        <h1 className="text-2xl font-extrabold">{u.name}</h1>
        <p className="mt-1 mb-3 text-muted-foreground">{u.email}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-xs font-semibold text-good">
          <ShieldCheck className="size-3.5" /> {u.role === 'admin' ? 'Administrator' : `Approved student · Class ${u.classLevel}`}
        </span>
        <p className="mt-3 text-xs text-muted-foreground">Member since {fmtDate(u.createdAt)}</p>
      </Card>
      <Card>
        <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={7} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current password"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Only to change password" /></Field>
              <Field label="New password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} placeholder="At least 6 characters" /></Field>
            </div>
            <Button type="submit" disabled={save.isPending} className="justify-self-start">Save changes</Button>
          </form>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={() => { logout(); router.push('/'); }}><LogOut /> Sign out</Button>
    </div>
  );
}
