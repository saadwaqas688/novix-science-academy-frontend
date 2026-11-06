'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, Lock, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AdminUserRow, UserStatus } from '@/lib/types';
import { fmtDate, fmtSpent } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, CLASS_OPTIONS, Online, Segmented, StatusBadge } from '@/components/admin-ui';
import { Field } from '@/components/common';
import { useConfirm } from '@/components/confirm';
import { Avatar } from '@/components/site-shell';

type Tab = UserStatus | 'all';

export default function UsersPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('pending');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const list = useQuery({
    queryKey: ['admin', 'users', tab, q],
    queryFn: () => api<{ users: AdminUserRow[]; counts: Record<Tab, number> }>(`/admin/users?${tab !== 'all' ? `status=${tab}&` : ''}q=${encodeURIComponent(q)}`),
    placeholderData: (p) => p,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) => api(`/admin/users/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: (_d, v) => { toast.success(v.status === 'approved' ? 'Approved — the student can sign in now' : v.status === 'disabled' ? 'Account disabled — the student cannot sign in' : v.status === 'rejected' ? 'Request rejected' : 'Updated'); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('User deleted'); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const c = list.data?.counts;

  const disable = async (u: AdminUserRow) => {
    if (await confirm({ title: `Disable ${u.name}?`, description: 'They will be signed out and cannot sign in until you enable the account again. Quiz results are kept.', confirmText: 'Disable', destructive: true })) update.mutate({ id: u.id, status: 'disabled' });
  };
  const actions = (u: AdminUserRow) => (
    <div className="flex flex-wrap justify-end gap-1.5 max-md:justify-start">
      {(u.status === 'approved' || u.status === 'disabled') && <Button asChild size="xs" variant="secondary"><Link href={`/admin/users/${u.id}`}><Eye /> View</Link></Button>}
      {u.status === 'pending' && <Button size="xs" onClick={() => update.mutate({ id: u.id, status: 'approved' })}><Check /> Approve</Button>}
      {u.status === 'rejected' && <Button size="xs" onClick={() => update.mutate({ id: u.id, status: 'approved' })}><Check /> Approve</Button>}
      {u.status === 'disabled' && <Button size="xs" onClick={() => update.mutate({ id: u.id, status: 'approved' })}><Check /> Enable</Button>}
      {u.status === 'pending' && <Button size="xs" variant="destructive" onClick={() => update.mutate({ id: u.id, status: 'rejected' })}>Reject</Button>}
      {u.status === 'approved' && <Button size="xs" variant="outline" onClick={() => disable(u)}><Lock /> Disable</Button>}
      {u.status !== 'pending' && (
        <Button size="xs" variant="outline" aria-label="Delete" onClick={async () => {
          if (await confirm({ title: `Delete ${u.name}?`, description: 'This removes the account and all of its test results.', confirmText: 'Delete', destructive: true })) remove.mutate(u.id);
        }}><Trash2 /></Button>
      )}
    </div>
  );

  return (
    <>
      <AdminTop title="Users" text="Approve sign-up requests and manage students" right={<Button size="sm" onClick={() => setAdding(true)}><Plus /> Add user</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Tab> value={tab} onChange={setTab} options={(['pending', 'approved', 'disabled', 'rejected', 'all'] as Tab[]).map((s) => ({ value: s, label: `${s[0].toUpperCase() + s.slice(1)}${c ? ` (${c[s]})` : ''}` }))} />
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-10" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent>
          {!list.data ? <Skeleton className="h-40" /> : list.data.users.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Quizzes</TableHead><TableHead>Time on app</TableHead><TableHead>Last active</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {list.data.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="max-md:block">
                      {(() => {
                        const who = <div className="flex items-center gap-3"><Avatar name={u.name} /><div className="min-w-0"><b className="block text-sm group-hover:text-brand-ink group-hover:underline">{u.name}</b><small className="text-xs text-muted-foreground">{u.email} · {u.phone}</small></div></div>;
                        return u.status === 'approved' || u.status === 'disabled' ? <Link href={`/admin/users/${u.id}`} className="group block">{who}</Link> : who;
                      })()}
                    </TableCell>
                    <TableCell data-label="Class">Class {u.classLevel}</TableCell>
                    <TableCell data-label="Quizzes"><b>{u.quizCount}</b>{u.averageScore !== null && <span className="text-muted-foreground"> · avg {u.averageScore}%</span>}</TableCell>
                    <TableCell data-label="Time on app">{u.activeSec14 ? fmtSpent(u.activeSec14) : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell data-label="Last active">{u.online ? <Online /> : u.lastSeenAt ? fmtDate(u.lastSeenAt, false) : <span className="text-muted-foreground">{u.status === 'pending' ? `Joined ${fmtDate(u.createdAt, false)}` : 'Never'}</span>}</TableCell>
                    <TableCell data-label="Status"><StatusBadge status={u.status} /></TableCell>
                    <TableCell className="max-md:block">{actions(u)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="py-12 text-center text-muted-foreground">No users here.</p>}
        </CardContent>
      </Card>
      <AddUserDialog open={adding} onOpenChange={setAdding} onDone={() => { setTab('approved'); invalidate(); }} />
    </>
  );
}

function AddUserDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const empty = { name: '', email: '', phone: '', classLevel: '9', password: '' };
  const [f, setF] = useState(empty);
  const add = useMutation({
    mutationFn: () => api('/admin/users', { json: f }),
    onSuccess: () => { toast.success('User added and approved'); setF(empty); onOpenChange(false); onDone(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add user</DialogTitle><DialogDescription>Users added by the admin are approved automatically.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Field label="Full name"><Input required minLength={2} value={f.name} onChange={set('name')} /></Field>
          <Field label="Email"><Input type="email" required value={f.email} onChange={set('email')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><Input required minLength={7} value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Class">
              <Select value={f.classLevel} onValueChange={(v) => setF({ ...f, classLevel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLASS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Temporary password"><Input required minLength={6} value={f.password} onChange={set('password')} placeholder="At least 6 characters" /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={add.isPending}>Add user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
