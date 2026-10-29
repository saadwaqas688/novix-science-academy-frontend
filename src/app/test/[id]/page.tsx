'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AssessmentMeta, AttemptResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress, Skeleton } from '@/components/ui/misc';
import { AuthGate, ErrorState } from '@/components/common';
import { useConfirm } from '@/components/confirm';

type TestData = { assessment: AssessmentMeta; questions: { id: number; text: string; options: string[] }[] };

export default function TestRoute() {
  return <AuthGate><TakeTest /></AuthGate>;
}

function TakeTest() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['test', id], queryFn: () => api<TestData>(`/assessments/${id}`), staleTime: Infinity });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [t0] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  const n = q.data?.questions.length || 0;
  useEffect(() => { if (n && answers.length !== n) setAnswers(Array(n).fill(null)); }, [n, answers.length]);
  useEffect(() => { const t = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000); return () => clearInterval(t); }, [t0]);

  const submit = useMutation({
    mutationFn: () => api<AttemptResult>(`/assessments/${id}/attempts`, { json: { answers, durationSec: Math.floor((Date.now() - t0) / 1000) } }),
    onSuccess: (r) => {
      qc.setQueryData(['attempt', String(r.attempt.id)], r);
      qc.invalidateQueries({ queryKey: ['chapter'] });
      qc.invalidateQueries({ queryKey: ['subject'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      router.replace(`/results/${r.attempt.id}`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const pick = useCallback((k: number) => setAnswers((a) => a.map((x, i) => (i === idx ? k : x))), [idx]);

  const onSubmit = async () => {
    const left = answers.filter((x) => x === null).length;
    if (left && !(await confirm({ title: 'Submit test?', description: `You have ${left} unanswered question${left > 1 ? 's' : ''}. Unanswered questions are marked wrong.`, confirmText: 'Submit', cancelText: 'Keep going' }))) return;
    submit.mutate();
  };
  const onLeave = async () => {
    if (await confirm({ title: 'Leave this test?', description: 'Your answers will not be saved.', confirmText: 'Leave test', cancelText: 'Stay', destructive: true }))
      router.push(q.data ? `/chapters/${q.data.assessment.chapter.id}#assessments` : '/courses');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]') || !n) return;
      const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
      if (k >= 0 && e.key.length === 1) pick(k);
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, n - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n, pick]);

  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!q.data || answers.length !== n) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-80" /></div>;
  const { assessment: a, questions } = q.data;
  const cur = questions[idx];
  const answered = answers.filter((x) => x !== null).length;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onLeave} aria-label="Leave test"><X /></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{a.topic}</h1>
          <p className="text-[13px] text-muted-foreground">{a.subject.name} · Chapter {a.chapter.number} · {answered}/{n} answered</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[13.5px] font-bold tabular-nums"><Clock className="size-4" /> {mm}:{ss}</span>
      </div>
      <Progress value={((idx + 1) / n) * 100} className="mb-5" />

      <div className="grid items-start gap-5 md:grid-cols-[1fr_220px]">
        <div className="glass order-2 rounded-2xl border border-border p-5 shadow-soft sm:p-7 md:order-1">
          <div className="text-xs font-bold tracking-wider text-brand-ink uppercase">Question {idx + 1} of {n}</div>
          <p className="mt-2.5 mb-5 font-display text-lg leading-snug font-semibold sm:text-[22px]">{cur.text}</p>
          <div className="flex flex-col gap-2.5">
            {cur.options.map((o, k) => {
              const sel = answers[idx] === k;
              return (
                <button key={k} onClick={() => pick(k)} className={cn('flex min-h-14 items-center gap-3.5 rounded-2xl border-[1.5px] border-input bg-surface px-4 py-3 text-left font-medium transition hover:border-primary', sel && 'border-primary bg-primary/5 ring-4 ring-ring/25')}>
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-[13px] font-bold text-muted-foreground transition', sel && 'bg-gradient-accent text-white')}>{'ABCD'[k]}</span>
                  {o}
                </button>
              );
            })}
          </div>
          <div className="pb-safe fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-border bg-white/95 px-4 pt-3 pb-3 backdrop-blur-xl md:static md:mt-6 md:justify-between md:border-0 md:bg-transparent md:p-0">
            <Button variant="outline" className="flex-1 md:flex-none" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft /> Previous</Button>
            {idx < n - 1
              ? <Button className="flex-1 md:flex-none" onClick={() => setIdx(idx + 1)}>Next <ChevronRight /></Button>
              : <Button className="flex-1 md:flex-none" onClick={onSubmit} disabled={submit.isPending}>{submit.isPending ? <Loader2 className="animate-spin" /> : <Check />} Submit</Button>}
          </div>
        </div>

        <div className="glass order-1 rounded-2xl border border-border p-3 shadow-soft md:order-2 md:p-4">
          <h4 className="mb-3 hidden text-sm font-bold md:block">Questions</h4>
          <div className="grid grid-cols-10 gap-1.5 md:grid-cols-5 md:gap-2">
            {questions.map((_, k) => (
              <button key={k} onClick={() => setIdx(k)} className={cn('aspect-square rounded-lg border-[1.5px] border-transparent bg-secondary text-xs font-bold text-muted-foreground md:rounded-xl md:text-sm', answers[k] !== null && 'bg-brand-wash text-brand-ink', k === idx && 'border-primary text-brand-ink')}>{k + 1}</button>
            ))}
          </div>
          <div className="mt-3.5 hidden flex-col gap-1.5 text-xs text-muted-foreground md:flex">
            <span className="flex items-center gap-2"><i className="size-3 rounded border border-primary bg-brand-wash" />Answered</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded bg-secondary" />Not answered</span>
          </div>
          <Button variant="secondary" size="sm" className="mt-3.5 hidden w-full md:flex" onClick={onSubmit} disabled={submit.isPending}>Submit test</Button>
        </div>
      </div>
    </>
  );
}
