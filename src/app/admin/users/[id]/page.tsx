'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CalendarDays, Check, ChevronLeft, Clock, Layers, ListChecks, Lock, MonitorSmartphone, Target, TrendingUp, Video } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { ActivityResult, UserActivity, UserStatus } from '@/lib/types';
import { cn, fmtDate, fmtDuration, fmtSpent } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kpi, Online, ScoreBadge, StatusBadge } from '@/components/admin-ui';
import { ErrorState } from '@/components/common';
import { useConfirm } from '@/components/confirm';
import { Avatar } from '@/components/site-shell';

const pct = (r: { score: number; total: number }) => (r.total ? (r.score * 100) / r.total : 0);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['admin', 'user-activity', id], queryFn: () => api<UserActivity>(`/admin/users/${id}/activity`), refetchInterval: 60_000 });
  const update = useMutation({
    mutationFn: (status: UserStatus) => api(`/admin/users/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: (_d, s) => { toast.success(s === 'disabled' ? 'Account disabled — the student cannot sign in' : 'Account enabled — the student can sign in again'); qc.invalidateQueries({ queryKey: ['admin'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!q.data) return <div className="space-y-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;
  const { user: u, results, time, videosWatched } = q.data;

  const disable = async () => {
    if (await confirm({ title: `Disable ${u.name}?`, description: 'They will be signed out and cannot sign in until you enable the account again. Quiz results are kept.', confirmText: 'Disable', destructive: true })) update.mutate('disabled');
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back"><Link href="/admin/users"><ChevronLeft /></Link></Button>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-[28px]">Student details</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quizzes, results and time spent on the app</p>
        </div>
      </div>

      {u.status === 'disabled' && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-critical-soft px-4 py-3 text-sm font-semibold text-critical">
          <Lock className="size-4.5 shrink-0" /> This account is disabled — {u.name.split(' ')[0]} cannot sign in. Enable it to give access again.
        </div>
      )}

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar name={u.name} className="size-14 text-lg" />
          <div className="min-w-[200px] flex-1">
            <h2 className="text-xl font-extrabold">{u.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground">
              <span>{u.email}</span><span>{u.phone}</span><span>Class {u.classLevel}</span><span>Joined {fmtDate(u.createdAt)}</span>
              <StatusBadge status={u.status} />{time.online && <Online />}
            </div>
          </div>
          {u.status === 'disabled'
            ? <Button size="sm" disabled={update.isPending} onClick={() => update.mutate('approved')}><Check /> Enable account</Button>
            : u.status === 'approved' && <Button size="sm" variant="outline" disabled={update.isPending} onClick={disable}><Lock /> Disable account</Button>}
        </CardContent>
      </Card>

      <Tabs defaultValue="quizzes">
        <TabsList>
          <TabsTrigger value="quizzes"><Target /> Quizzes <Count n={results.length} /></TabsTrigger>
          <TabsTrigger value="time"><Clock /> Time on app <Count n={fmtSpent(time.activeSec14)} /></TabsTrigger>
        </TabsList>
        <TabsContent value="quizzes"><QuizzesTab results={results} /></TabsContent>
        <TabsContent value="time"><TimeTab time={time} videosWatched={videosWatched} /></TabsContent>
      </Tabs>
    </>
  );
}

function QuizzesTab({ results }: { results: ActivityResult[] }) {
  if (!results.length) return <Card><CardContent><p className="py-12 text-center text-muted-foreground">This student has not taken any quiz yet.</p></CardContent></Card>;
  const avg = Math.round(results.reduce((n, r) => n + pct(r), 0) / results.length);
  const best = results.reduce((b, r) => (pct(r) > pct(b) ? r : b), results[0]);
  const groups = new Map<string, ActivityResult[]>();
  results.forEach((r) => {
    const k = `${r.subjectSlug}|${r.classLevel}|${r.chapterNumber}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  });
  const chapters = [...groups.values()].sort((a, b) => a[0].subjectName.localeCompare(b[0].subjectName) || +a[0].classLevel - +b[0].classLevel || a[0].chapterNumber - b[0].chapterNumber);

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={ListChecks} bg="bg-gradient-to-br from-indigo-500 to-indigo-700" value={results.length} label="Quizzes taken" />
        <Kpi icon={Layers} bg="bg-gradient-accent" value={groups.size} label="Chapters covered" />
        <Kpi icon={Target} bg="bg-gradient-to-br from-emerald-500 to-emerald-700" value={`${avg}%`} label="Average score" />
        <Kpi icon={Award} bg="bg-gradient-to-br from-amber-500 to-amber-600" value={`${best.score}/${best.total}`} label="Best score" />
      </div>

      <Card className="mb-5">
        <CardContent>
          <h3 className="mb-3 text-[17px] font-bold">Chapter-wise summary</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Chapter</TableHead><TableHead>Subject</TableHead><TableHead>Quizzes done</TableHead><TableHead>Attempts</TableHead><TableHead>Average</TableHead><TableHead className="text-right">Best</TableHead></TableRow></TableHeader>
            <TableBody>
              {chapters.map((l) => {
                const f = l[0];
                const a = Math.round(l.reduce((n, r) => n + pct(r), 0) / l.length);
                const b = l.reduce((x, r) => (pct(r) > pct(x) ? r : x), l[0]);
                return (
                  <TableRow key={`${f.subjectSlug}${f.classLevel}${f.chapterNumber}`}>
                    <TableCell className="max-md:block"><b>Ch {f.chapterNumber} · {f.chapterTitle}</b></TableCell>
                    <TableCell data-label="Subject">{f.subjectName} · Class {f.classLevel}</TableCell>
                    <TableCell data-label="Quizzes done">{new Set(l.map((r) => r.key)).size}</TableCell>
                    <TableCell data-label="Attempts">{l.length}</TableCell>
                    <TableCell data-label="Average">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary"><i className={cn('block h-full rounded-full', a >= 80 ? 'bg-good' : a >= 50 ? 'bg-amber-500' : 'bg-critical')} style={{ width: `${a}%` }} /></div>
                        <b>{a}%</b>
                      </div>
                    </TableCell>
                    <TableCell data-label="Best" className="text-right"><ScoreBadge score={b.score} total={b.total} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[17px] font-bold">All quiz attempts</h3><span className="text-[13px] text-muted-foreground">Newest first</span></div>
          <Table>
            <TableHeader><TableRow><TableHead>Quiz</TableHead><TableHead>Chapter</TableHead><TableHead>Date</TableHead><TableHead>Time taken</TableHead><TableHead className="text-right">Result</TableHead></TableRow></TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={`${r.kind}${r.id}`}>
                  <TableCell className="max-md:block"><b className="block">{r.topic}</b><small className="text-xs text-muted-foreground">{r.subjectName} · Class {r.classLevel}</small></TableCell>
                  <TableCell data-label="Chapter">Ch {r.chapterNumber} · {r.chapterTitle}</TableCell>
                  <TableCell data-label="Date">{fmtDate(r.createdAt)}</TableCell>
                  <TableCell data-label="Time taken">{fmtDuration(r.durationSec)}</TableCell>
                  <TableCell data-label="Result" className="text-right"><ScoreBadge score={r.score} total={r.total} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function TimeTab({ time, videosWatched }: { time: UserActivity['time']; videosWatched: number }) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
  const perDay = days.map((d) => time.sessions.filter((s) => dayKey(new Date(s.startedAt)) === dayKey(d)).reduce((n, s) => n + s.activeSec, 0));
  const max = Math.max(1800, ...perDay);
  const time12 = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Clock} bg="bg-gradient-accent" value={fmtSpent(time.activeSec14)} label="Total time · last 14 days" />
        <Kpi icon={TrendingUp} bg="bg-gradient-to-br from-indigo-500 to-indigo-700" value={time.activeDays14 ? fmtSpent(time.activeSec14 / time.activeDays14) : '—'} label="Average per active day" />
        <Kpi icon={CalendarDays} bg="bg-gradient-to-br from-amber-500 to-amber-600" value={time.sessionCount14} label="Sessions · last 14 days" />
        <Kpi icon={Video} bg="bg-gradient-to-br from-red-500 to-red-700" value={videosWatched} label="Lectures watched" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-[17px] font-bold">Last 7 days</h3><span className="text-[13px] text-muted-foreground">Time per day</span></div>
            <div className="flex h-48 items-end gap-3 border-b border-dashed border-border pt-2">
              {perDay.map((sec, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <b className="text-[11.5px]">{sec >= 60 ? fmtSpent(sec) : ''}</b>
                  <i className={cn('block w-full max-w-11 rounded-t-lg rounded-b-sm', sec ? 'bg-gradient-accent' : 'bg-secondary')} style={{ height: `${Math.max(2, (sec / max) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-3">{days.map((d) => <span key={+d} className="flex-1 text-center text-xs text-muted-foreground">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>)}</div>
            <p className="mt-3 flex gap-2 text-[12.5px] text-muted-foreground"><Clock className="mt-0.5 size-3.5 shrink-0" /> Time is counted only while the app is open on screen. If the student is idle for more than 5 minutes, the clock stops.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[17px] font-bold">Recent sessions</h3>
              {time.online ? <Online /> : time.lastSeenAt && <span className="text-[13px] text-muted-foreground">Last active {fmtDate(time.lastSeenAt, false)}, {time12(time.lastSeenAt)}</span>}
            </div>
            {time.sessions.length ? (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Started</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Device</TableHead></TableRow></TableHeader>
                <TableBody>
                  {time.sessions.slice(0, 10).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell data-label="Date"><b>{fmtDate(s.startedAt, false)}</b></TableCell>
                      <TableCell data-label="Started">{time12(s.startedAt)}</TableCell>
                      <TableCell data-label="Duration">{fmtSpent(s.activeSec)}</TableCell>
                      <TableCell data-label="Device" className="text-right capitalize"><span className="inline-flex items-center gap-1.5"><MonitorSmartphone className="size-3.5" />{s.device || '—'}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="py-10 text-center text-muted-foreground">No activity in the last 14 days.</p>}
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">All-time total: <b className="text-foreground">{fmtSpent(time.activeSecAll)}</b></p>
    </>
  );
}

const Count = ({ n }: { n: React.ReactNode }) => <span className="rounded-full bg-secondary px-2 text-[11.5px]">{n}</span>;
