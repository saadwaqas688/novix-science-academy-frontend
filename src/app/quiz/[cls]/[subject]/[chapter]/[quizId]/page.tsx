'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import { loadChapterQuizFile, quizKey, shuffle, type Quiz } from '@/lib/quizzes';
import type { QuizResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress, Skeleton } from '@/components/ui/misc';
import { AuthGate, ErrorState } from '@/components/common';
import { useConfirm } from '@/components/confirm';

/** A question as shown: original index + shuffled option order. */
interface Shown { qi: number; opts: number[] }

export default function QuizRoute() {
  return <AuthGate><TakeQuiz /></AuthGate>;
}

function TakeQuiz() {
  const p = useParams<{ cls: string; subject: string; chapter: string; quizId: string }>();
  const chapterNo = Number(p.chapter);
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const file = useQuery({ queryKey: ['quiz-file', p.cls, p.subject, chapterNo], queryFn: () => loadChapterQuizFile(p.subject, p.cls, chapterNo), staleTime: Infinity });
  const quiz: Quiz | undefined = file.data?.quizzes.find((q) => q.id === p.quizId);

  const [shown, setShown] = useState<Shown[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]); // chosen display position per shown question
  const [t0] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!quiz || shown.length) return;
    const order = shuffle(quiz.questions.map((_, i) => i));
    setShown(order.map((qi) => ({ qi, opts: shuffle(quiz.questions[qi].options.map((_, j) => j)) })));
    setAnswers(Array(order.length).fill(null));
  }, [quiz, shown.length]);
  useEffect(() => { const t = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000); return () => clearInterval(t); }, [t0]);

  const n = shown.length;
  const submit = useMutation({
    mutationFn: () => {
      // convert to original question order + original option index
      const original: (number | null)[] = Array(quiz!.questions.length).fill(null);
      shown.forEach((s, pos) => { const a = answers[pos]; original[s.qi] = a === null ? null : s.opts[a]; });
      const score = quiz!.questions.reduce((acc, q, i) => acc + (original[i] === q.answer ? 1 : 0), 0);
      return api<{ result: QuizResult }>('/quiz-results', {
        json: {
          quizKey: quizKey(p.cls, p.subject, chapterNo, quiz!.id), subjectSlug: p.subject, classLevel: p.cls, chapterNumber: chapterNo,
          chapterTitle: file.data!.chapterTitle, topic: quiz!.topic, answers: original, score, total: quiz!.questions.length,
          durationSec: Math.floor((Date.now() - t0) / 1000),
        },
      });
    },
    onSuccess: (r) => {
      qc.setQueryData(['quiz-result', String(r.result.id)], { result: r.result });
      qc.invalidateQueries({ queryKey: ['quiz-results'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      router.replace(`/quiz-result/${r.result.id}`);
    },
    onError: (e) => toast.error(errMsg(e) + ' — your answers are still here, please try again.'),
  });

  const pick = useCallback((k: number) => setAnswers((a) => a.map((x, i) => (i === idx ? k : x))), [idx]);
  const back = () => router.push(`/courses/${p.subject}`);

  const onSubmit = async () => {
    const left = answers.filter((x) => x === null).length;
    if (left && !(await confirm({ title: 'Submit quiz?', description: `You have ${left} unanswered question${left > 1 ? 's' : ''}. Unanswered questions are marked wrong.`, confirmText: 'Submit', cancelText: 'Keep going' }))) return;
    submit.mutate();
  };
  const onLeave = async () => {
    if (await confirm({ title: 'Leave this quiz?', description: 'Your answers will not be saved.', confirmText: 'Leave quiz', cancelText: 'Stay', destructive: true })) back();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]') || !n) return;
      const opts = shown[idx]?.opts.length || 4;
      const k = '123456'.indexOf(e.key) >= 0 ? '123456'.indexOf(e.key) : 'abcdef'.indexOf(e.key.toLowerCase());
      if (k >= 0 && k < opts && e.key.length === 1) pick(k);
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, n - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n, pick, shown, idx]);

  if (file.error) return <ErrorState message={(file.error as Error).message} onRetry={() => file.refetch()} />;
  if (file.data && !quiz) return <ErrorState message="Quiz not found" />;
  if (!quiz || !n) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-80" /></div>;

  const cur = quiz.questions[shown[idx].qi];
  const answered = answers.filter((x) => x !== null).length;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');
  const letters = 'ABCDEF';

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onLeave} aria-label="Leave quiz"><X /></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{quiz.topic}</h1>
          <p className="text-[13px] text-muted-foreground">Chapter {chapterNo} · {file.data!.chapterTitle} · {answered}/{n} answered</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[13.5px] font-bold tabular-nums"><Clock className="size-4" /> {mm}:{ss}</span>
      </div>
      <Progress value={((idx + 1) / n) * 100} className="mb-5" />

      <div className="grid items-start gap-5 md:grid-cols-[1fr_220px]">
        <div className="glass order-2 rounded-2xl border border-border p-5 shadow-soft sm:p-7 md:order-1">
          <div className="text-xs font-bold tracking-wider text-brand-ink uppercase">Question {idx + 1} of {n}</div>
          <p className="mt-2.5 mb-5 font-display text-lg leading-snug font-semibold sm:text-[22px]">{cur.q}</p>
          <div className="flex flex-col gap-2.5">
            {shown[idx].opts.map((oi, k) => {
              const sel = answers[idx] === k;
              return (
                <button key={k} onClick={() => pick(k)} className={cn('flex min-h-14 items-center gap-3.5 rounded-2xl border-[1.5px] border-input bg-surface px-4 py-3 text-left font-medium transition hover:border-primary', sel && 'border-primary bg-primary/5 ring-4 ring-ring/25')}>
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-[13px] font-bold text-muted-foreground transition', sel && 'bg-gradient-accent text-white')}>{letters[k]}</span>
                  {cur.options[oi]}
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
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 md:grid-cols-5 md:gap-2">
            {shown.map((_, k) => (
              <button key={k} onClick={() => setIdx(k)} className={cn('aspect-square rounded-lg border-[1.5px] border-transparent bg-secondary text-xs font-bold text-muted-foreground md:rounded-xl md:text-sm', answers[k] !== null && 'bg-brand-wash text-brand-ink', k === idx && 'border-primary text-brand-ink')}>{k + 1}</button>
            ))}
          </div>
          <div className="mt-3.5 hidden flex-col gap-1.5 text-xs text-muted-foreground md:flex">
            <span className="flex items-center gap-2"><i className="size-3 rounded border border-primary bg-brand-wash" />Answered</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded bg-secondary" />Not answered</span>
          </div>
          <Button variant="secondary" size="sm" className="mt-3.5 hidden w-full md:flex" onClick={onSubmit} disabled={submit.isPending}>Submit quiz</Button>
        </div>
      </div>
    </>
  );
}
