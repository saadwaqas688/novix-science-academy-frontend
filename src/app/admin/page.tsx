'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, ListChecks, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AdminAttempt, User } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, Kpi, ScoreBadge } from '@/components/admin-ui';
import { Avatar } from '@/components/site-shell';

type Stats = {
  students: number; pending: number; attempts: number; averageScore: number; pendingUsers: User[]; recentAttempts: AdminAttempt[];
  content: { slug: string; name: string; color: string; chapters: number; withNotes: number; withVideos: number; tests: number }[];
};

export default function AdminDashboard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/admin/stats?classLevel=9') });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api(`/admin/users/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: (_d, v) => { toast.success(v.status === 'approved' ? 'User approved — they can sign in now' : 'User rejected'); qc.invalidateQueries({ queryKey: ['admin'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const d = q.data;

  return (
    <>
      <AdminTop title="Dashboard" text="Overview of students, content and assessments" />
      {!d ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Kpi icon={Users} bg="bg-gradient-accent" value={d.students} label="Approved students" />
            <Kpi icon={Clock} bg="bg-gradient-to-br from-amber-400 to-amber-600" value={d.pending} label="Pending approvals" />
            <Kpi icon={ListChecks} bg="bg-gradient-to-br from-indigo-500 to-indigo-700" value={d.attempts} label="Tests taken" />
            <Kpi icon={Target} bg="bg-gradient-to-br from-emerald-500 to-emerald-700" value={`${d.averageScore}%`} label="Average score" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader><CardTitle>Pending approvals</CardTitle><Button asChild variant="outline" size="xs"><Link href="/admin/users">View all</Link></Button></CardHeader>
              <CardContent>
                {d.pendingUsers.length ? d.pendingUsers.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-0 first:pt-0">
                    <Avatar name={u.name} />
                    <div className="min-w-0 flex-1"><b className="block truncate text-sm">{u.name}</b><small className="text-xs text-muted-foreground">{u.email} · Class {u.classLevel}</small></div>
                    <div className="flex gap-1.5">
                      <Button size="xs" onClick={() => setStatus.mutate({ id: u.id, status: 'approved' })}><Check /> Approve</Button>
                      <Button size="xs" variant="destructive" onClick={() => setStatus.mutate({ id: u.id, status: 'rejected' })}>Reject</Button>
                    </div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-muted-foreground">No pending requests</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Content status · Class 9</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {d.content.map((c) => (
                  <div key={c.slug}>
                    <div className="mb-1.5 flex justify-between gap-2 text-sm font-semibold"><span>{c.name}</span><span className="font-medium text-muted-foreground">{c.withNotes}/{c.chapters} notes · {c.withVideos} videos · {c.tests} tests</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${Math.max(4, c.chapters ? (c.withNotes / c.chapters) * 100 : 0)}%`, background: c.color }} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>Recent assessment attempts</CardTitle><Button asChild variant="outline" size="xs"><Link href="/admin/results">All results</Link></Button></CardHeader>
            <CardContent>
              {d.recentAttempts.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Assessment</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.recentAttempts.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell data-label="Student" className="font-semibold">{t.userName}</TableCell>
                        <TableCell data-label="Assessment">{t.topic} <span className="text-muted-foreground">· {t.subjectName}</span></TableCell>
                        <TableCell data-label="Date">{fmtDate(t.createdAt)}</TableCell>
                        <TableCell data-label="Score" className="text-right"><ScoreBadge score={t.score} total={t.total} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="py-6 text-center text-sm text-muted-foreground">No attempts yet.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
