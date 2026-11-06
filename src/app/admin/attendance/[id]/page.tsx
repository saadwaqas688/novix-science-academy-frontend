'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Legend as ChartLegend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AttendanceMark, AttendanceStudentDetail } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { ErrorState, Field } from '@/components/common';
import { useConfirm } from '@/components/confirm';
import { Avatar } from '@/components/site-shell';
import { Legend, MARK_COLOR, MARK_LABEL, MARK_SHORT, fmtDay, pctOf, pctTone } from '@/components/attendance-ui';

const PERIODS = [
  { days: 7, label: 'Last week' },
  { days: 10, label: 'Last 10 days' },
  { days: 20, label: 'Last 20 days' },
  { days: 30, label: 'Last month' },
];
const ORDER: (AttendanceMark | null)[] = ['present', 'absent', 'leave', null];

/* date helpers on YYYY-MM-DD strings (UTC, no timezone drift) */
const toUtc = (d: string) => { const [y, m, day] = d.split('-').map(Number); return Date.UTC(y, m - 1, day); };
const fromUtc = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => fromUtc(toUtc(d) + n * 86400000);

function count(records: { status: AttendanceMark }[]) {
  const c = { present: 0, absent: 0, leave: 0 };
  records.forEach((r) => { c[r.status]++; });
  return { ...c, marked: records.length, pct: pctOf(c.present, records.length) };
}

export default function AttendanceStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(false);
  const q = useQuery({ queryKey: ['admin', 'attendance', 'student', id], queryFn: () => api<AttendanceStudentDetail>(`/admin/attendance/students/${id}`) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'attendance'] });
  const setMark = useMutation({
    mutationFn: ({ date, status }: { date: string; status: AttendanceMark | null }) => api(`/admin/attendance/students/${id}/records/${date}`, { method: 'PUT', json: { status } }),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/attendance/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Student removed from the register'); refresh(); router.push('/admin/attendance'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const data = q.data;
  const view = useMemo(() => {
    if (!data) return null;
    const recs = data.records;
    const anchor = data.latestDate ?? recs[recs.length - 1]?.date ?? fromUtc(Date.now());
    const byDate = new Map(recs.map((r) => [r.date, r.status]));
    const periods = PERIODS.map((p) => {
      const from = addDays(anchor, -(p.days - 1));
      return { ...p, from, ...count(recs.filter((r) => r.date >= from && r.date <= anchor)) };
    });
    const months = new Map<string, AttendanceStudentDetail['records']>();
    recs.forEach((r) => { const k = r.date.slice(0, 7); months.set(k, [...(months.get(k) ?? []), r]); });
    const monthly = [...months.entries()].slice(-12).map(([k, l]) => {
      const c = count(l);
      return { month: new Date(toUtc(`${k}-01`)).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }), Present: c.present, Absent: c.absent, Leave: c.leave, pct: c.pct };
    });
    // calendar: 6 weeks ending on the anchor's week (Mon–Sun)
    const anchorDow = (new Date(toUtc(anchor)).getUTCDay() + 6) % 7;
    const end = addDays(anchor, 6 - anchorDow);
    const start = addDays(end, -41);
    const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
    const absentDays = recs.filter((r) => r.status === 'absent').map((r) => r.date).reverse();
    return { anchor, periods, all: count(recs), monthly, weeks, byDate, absentDays };
  }, [data]);

  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!data || !view) return <div className="space-y-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-28" /><Skeleton className="h-72" /></div>;
  const { student } = data;
  const pie = (['present', 'absent', 'leave'] as AttendanceMark[]).map((m) => ({ name: MARK_LABEL[m], value: view.all[m], color: MARK_COLOR[m] })).filter((x) => x.value);
  const chartPeriods = view.periods.map((p) => ({ name: p.label, Present: p.present, Absent: p.absent, Leave: p.leave }));

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back"><Link href="/admin/attendance"><ChevronLeft /></Link></Button>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-[28px]">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Periods count back from the latest date in the register: <b>{fmtDay(view.anchor)}</b></p>
        </div>
      </div>

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar name={student.name} className="size-14 text-lg" />
          <div className="min-w-[180px] flex-1">
            <h2 className="text-xl font-extrabold">{student.name}</h2>
            <p className="text-[13px] text-muted-foreground">{student.groupName ? `${student.groupName} · ` : ''}{view.all.marked} days marked{data.records.length ? ` · ${fmtDay(data.records[0].date, false)} – ${fmtDay(data.records[data.records.length - 1].date)}` : ''}</p>
          </div>
          <div className="text-right">
            <div className={cn('font-display text-3xl font-extrabold', pctTone(view.all.pct))}>{view.all.pct === null ? '—' : `${view.all.pct}%`}</div>
            <div className="text-xs text-muted-foreground">overall attendance</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setRenaming(true)}><Pencil /> Rename</Button>
            <Button size="sm" variant="outline" aria-label="Delete" onClick={async () => {
              if (await confirm({ title: `Remove ${student.name}?`, description: 'This deletes the student and all of their attendance marks from the register.', confirmText: 'Remove', destructive: true })) remove.mutate();
            }}><Trash2 /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {view.periods.map((p) => (
          <div key={p.days} className="glass rounded-2xl border border-border p-4 shadow-soft">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-muted-foreground">{p.label}</span>
              <span className={cn('font-display text-xl font-extrabold', pctTone(p.pct))}>{p.pct === null ? '—' : `${p.pct}%`}</span>
            </div>
            <div className="mb-2.5 flex h-2.5 overflow-hidden rounded-full bg-secondary">
              {(['present', 'leave', 'absent'] as AttendanceMark[]).map((m) => p.marked ? <i key={m} style={{ width: `${(p[m] / p.marked) * 100}%`, background: MARK_COLOR[m] }} /> : null)}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px]">
              <span><b className="text-good">{p.present}</b> present</span>
              <span><b className="text-critical">{p.absent}</b> absent</span>
              {p.leave > 0 && <span><b className="text-amber-600">{p.leave}</b> leave</span>}
            </div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">{fmtDay(p.from, false)} – {fmtDay(view.anchor, false)}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent>
            <h3 className="mb-3 text-[17px] font-bold">Present vs absent</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPeriods} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(13,148,136,0.06)' }} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                  <ChartLegend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Present" fill={MARK_COLOR.present} radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="Absent" fill={MARK_COLOR.absent} radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="Leave" fill={MARK_COLOR.leave} radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="mb-3 text-[17px] font-bold">All days</h3>
            {pie.length ? (
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
                      {pie.map((x) => <Cell key={x.name} fill={x.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                    <ChartLegend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                  <div className={cn('font-display text-2xl font-extrabold', pctTone(view.all.pct))}>{view.all.pct ?? 0}%</div>
                  <div className="text-[11px] text-muted-foreground">present</div>
                </div>
              </div>
            ) : <p className="py-16 text-center text-muted-foreground">No marks yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[17px] font-bold">Last 6 weeks</h3><Legend /></div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="text-[11px] font-semibold text-muted-foreground">{d}</span>)}
              {view.weeks.flat().map((day) => {
                const m = view.byDate.get(day) ?? null;
                const future = day > view.anchor;
                return (
                  <button
                    key={day}
                    disabled={future || setMark.isPending}
                    title={`${fmtDay(day)} — ${m ? MARK_LABEL[m] : 'No record'}${future ? '' : ' (click to change)'}`}
                    onClick={() => setMark.mutate({ date: day, status: ORDER[(ORDER.indexOf(m) + 1) % ORDER.length] })}
                    className={cn('flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-bold transition', m ? 'text-white hover:opacity-85' : 'border border-border bg-secondary text-muted-foreground hover:border-primary', future && 'opacity-30')}
                    style={m ? { background: MARK_COLOR[m] } : undefined}
                  >
                    <span>{Number(day.slice(8))}</span>
                    {m && <span className="text-[9px] opacity-90">{MARK_SHORT[m]}</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Click a day to change it: Present → Absent → Leave → No record.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="mb-3 text-[17px] font-bold">Month by month</h3>
            {view.monthly.length ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.monthly} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: 'rgba(13,148,136,0.06)' }} contentStyle={{ borderRadius: 12, fontSize: 13 }} formatter={(v, n) => [v, n]} labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.pct ?? 0}% present`} />
                    <Bar dataKey="Present" stackId="a" fill={MARK_COLOR.present} maxBarSize={40} />
                    <Bar dataKey="Leave" stackId="a" fill={MARK_COLOR.leave} maxBarSize={40} />
                    <Bar dataKey="Absent" stackId="a" fill={MARK_COLOR.absent} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="py-16 text-center text-muted-foreground">No marks yet.</p>}
            {view.absentDays.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[13px] font-semibold">Absent on ({view.absentDays.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {view.absentDays.slice(0, 24).map((d) => <span key={d} className="rounded-full bg-critical-soft px-2.5 py-0.5 text-xs font-semibold text-critical">{fmtDay(d, false)}</span>)}
                  {view.absentDays.length > 24 && <span className="px-1 text-xs text-muted-foreground">+{view.absentDays.length - 24} more</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RenameDialog open={renaming} onOpenChange={setRenaming} id={student.id} name={student.name} group={student.groupName} onDone={refresh} />
    </>
  );
}

function RenameDialog({ open, onOpenChange, id, name, group, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; id: number; name: string; group: string; onDone: () => void }) {
  const [n, setN] = useState(name);
  const [g, setG] = useState(group);
  const save = useMutation({
    mutationFn: () => api(`/admin/attendance/students/${id}`, { method: 'PATCH', json: { name: n, groupName: g } }),
    onSuccess: () => { toast.success('Saved'); onOpenChange(false); onDone(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) { setN(name); setG(group); } onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit student</DialogTitle></DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Name"><Input required value={n} onChange={(e) => setN(e.target.value)} /></Field>
          <Field label="Class / group"><Input value={g} onChange={(e) => setG(e.target.value)} placeholder="e.g. 10-A" /></Field>
          <p className="-mt-2 text-xs text-muted-foreground">The next Excel upload matches students by name, so keep the name the same as in the sheet.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
