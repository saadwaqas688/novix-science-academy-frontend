'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BarChart3, CheckCircle2, ListChecks, RotateCcw, Target } from 'lucide-react';
import { api } from '@/lib/api';
import type { Progress as ProgressData } from '@/lib/types';
import { SubjectIcon, subjectCover } from '@/lib/subjects';
import { quizHref } from '@/lib/quizzes';
import { cn, fmtDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { AuthGate, ComingSoon, ErrorState, SectionHeading } from '@/components/common';

export default function ProgressRoute() {
  return <AuthGate><ProgressPage /></AuthGate>;
}

function ProgressPage() {
  const [filter, setFilter] = useState('all');
  const q = useQuery({ queryKey: ['progress'], queryFn: () => api<ProgressData>('/me/progress') });
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!q.data) return <div className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-80" /></div>;
  const { attempts, summary, bySubject } = q.data;
  const chron = [...attempts].reverse().filter((a) => filter === 'all' || a.subjectSlug === filter).slice(-12);
  const chartData = chron.map((a) => ({ id: `${a.kind}${a.id}`, label: fmtDate(a.createdAt, false), pct: Math.round((a.score / a.total) * 100), score: `${a.score}/${a.total}`, topic: a.topic, color: a.subjectColor }));

  return (
    <>
      <SectionHeading title="Assessment progress" text="Your MCQ test history and how you are improving." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi icon={ListChecks} bg="bg-gradient-accent" v={summary.count} l="Tests taken" />
        <Kpi icon={Target} bg="bg-gradient-to-br from-indigo-500 to-indigo-700" v={`${summary.average}%`} l="Average score" />
        <Kpi icon={Award} bg="bg-gradient-to-br from-amber-400 to-amber-600" v={summary.bestSubject?.split(' ')[0] || '—'} l="Strongest subject" />
        <Kpi icon={CheckCircle2} bg="bg-gradient-to-br from-emerald-500 to-emerald-700" v={summary.questionsAnswered} l="Questions answered" />
      </div>

      {!attempts.length ? (
        <ComingSoon icon={BarChart3} title="No tests yet" text="Take your first assessment from any chapter to see your progress here." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  {[{ slug: 'all', name: 'All' }, ...bySubject].map((s) => (
                    <button key={s.slug} onClick={() => setFilter(s.slug)} className={cn('h-8 rounded-full px-3 text-xs font-semibold', filter === s.slug ? 'bg-foreground text-white' : 'bg-secondary text-muted-foreground')}>{s.name.split(' ')[0]}</button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 22, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148,163,184,0.35)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} />
                        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} fontSize={11} />
                        <Tooltip cursor={{ fill: 'rgba(13,148,136,0.06)' }} content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload as (typeof chartData)[number];
                          return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lift"><div className="font-bold">{p.topic}</div><div className="text-muted-foreground">{p.label} · {p.score} ({p.pct}%)</div></div>;
                        }} />
                        <Bar dataKey="pct" radius={[10, 10, 4, 4]} maxBarSize={48}>
                          {chartData.map((d) => <Cell key={d.id} fill={d.color} />)}
                          <LabelList dataKey="score" position="top" fontSize={11} fontWeight={700} fill="#334155" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="py-16 text-center text-sm text-muted-foreground">No tests in this subject yet.</p>}
                <div className="mt-3 flex flex-wrap gap-3.5 text-xs text-muted-foreground">
                  {bySubject.map((s) => <span key={s.slug} className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Average by subject</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {bySubject.map((s) => (
                  <div key={s.slug}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>{s.name}</span><span>{s.count ? `${s.average}%` : '—'}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.average}%`, background: s.color }} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader><CardTitle>Recent attempts</CardTitle></CardHeader>
            <CardContent className="pt-2">
              {attempts.map((a) => {
                const tone = a.score / a.total >= 0.8 ? 'text-good' : a.score / a.total >= 0.5 ? 'text-warning' : 'text-critical';
                return (
                  <div key={`${a.kind}${a.id}`} className="flex items-center gap-3.5 border-t border-border py-3.5 first:border-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: subjectCover(a.subjectSlug, a.subjectColor) }}><SubjectIcon icon={a.subjectIcon} className="size-[18px]" /></span>
                    <Link href={a.kind === 'quiz' ? `/quiz-result/${a.id}` : `/results/${a.id}`} className="min-w-0 flex-1">
                      <b className="block truncate text-[14.5px]">{a.topic}</b>
                      <span className="text-[12.5px] text-muted-foreground">{a.subjectName} · Ch {a.chapterNumber} · {fmtDate(a.createdAt)}</span>
                    </Link>
                    <span className={cn('min-w-12 text-right font-display font-extrabold', tone)}>{a.score}/{a.total}</span>
                    <Link href={a.kind === 'quiz' ? quizHref(a.quizKey!) : `/test/${a.assessmentId}`} title="Retake" className="grid size-9 place-items-center rounded-full border border-border bg-surface text-ink-2 hover:border-primary hover:text-brand-ink"><RotateCcw className="size-4" /></Link>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function Kpi({ icon: Icon, bg, v, l }: { icon: React.ElementType; bg: string; v: React.ReactNode; l: string }) {
  return (
    <div className="glass rounded-2xl border border-border p-4 shadow-soft sm:p-5">
      <div className={cn('mb-3 grid size-10 place-items-center rounded-xl text-white', bg)}><Icon className="size-5" /></div>
      <div className="font-display text-2xl leading-tight font-extrabold sm:text-[28px]">{v}</div>
      <div className="text-[13px] text-muted-foreground">{l}</div>
    </div>
  );
}
