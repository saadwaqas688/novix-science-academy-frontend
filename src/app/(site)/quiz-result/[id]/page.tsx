'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Check, ChevronLeft, Eye, Lightbulb, RotateCcw, X } from 'lucide-react';
import { api } from '@/lib/api';
import { loadChapterQuizFile, quizHref } from '@/lib/quizzes';
import type { QuizResult } from '@/lib/types';
import { cn, fmtDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { AuthGate, ErrorState, ScoreRing } from '@/components/common';

export default function QuizResultRoute() {
  return <AuthGate><Result /></AuthGate>;
}

function Result() {
  const { id } = useParams<{ id: string }>();
  const [showReview, setShowReview] = useState(true);
  const q = useQuery({ queryKey: ['quiz-result', id], queryFn: () => api<{ result: QuizResult }>(`/quiz-results/${id}`) });
  const r = q.data?.result;
  const file = useQuery({
    queryKey: ['quiz-file', r?.classLevel, r?.subjectSlug, r?.chapterNumber],
    queryFn: () => loadChapterQuizFile(r!.subjectSlug, r!.classLevel, r!.chapterNumber),
    enabled: !!r, staleTime: Infinity,
  });
  if (q.error) return <ErrorState message={(q.error as Error).message} />;
  if (!r) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  const quizId = r.quizKey.split('/').pop();
  const quiz = file.data?.quizzes.find((x) => x.id === quizId);
  const pct = r.total ? r.score / r.total : 0;
  const unanswered = r.answers.filter((a) => a === null).length;
  const msg = pct >= 0.8 ? 'Excellent work!' : pct >= 0.5 ? 'Good effort — keep practising' : 'Keep going — review the notes and try again';
  const letters = 'ABCDEF';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass rounded-3xl border border-border p-6 text-center shadow-soft sm:p-8">
        <ScoreRing score={r.score} total={r.total} />
        <h1 className="mt-5 mb-1.5 text-2xl font-extrabold">{msg}</h1>
        <p className="text-muted-foreground">{r.topic} · {r.subjectName} · Chapter {r.chapterNumber}</p>
        <div className="my-6 grid grid-cols-3 gap-2.5">
          <Stat v={r.score} l="Correct" cls="text-good" />
          <Stat v={r.total - r.score - unanswered} l="Wrong" cls="text-critical" />
          <Stat v={fmtDuration(r.durationSec)} l="Time" />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button asChild><Link href={quizHref(r.quizKey)}><RotateCcw /> Retake</Link></Button>
          <Button variant="outline" onClick={() => setShowReview(!showReview)}><Eye /> {showReview ? 'Hide' : 'Review'} answers</Button>
          <Button asChild variant="outline"><Link href="/progress"><BarChart3 /> Progress</Link></Button>
        </div>
        <Link href={`/courses/${r.subjectSlug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink"><ChevronLeft className="size-4" /> Back to {r.subjectName}</Link>
      </div>

      {showReview && (
        <div className="mt-5 flex flex-col gap-3">
          {!quiz && <Skeleton className="h-40" />}
          {quiz?.questions.map((qq, i) => {
            const a = r.answers[i] ?? null;
            const ok = a === qq.answer;
            return (
              <div key={i} className="glass rounded-2xl border border-border p-4 shadow-soft sm:p-5">
                <p className="mb-2.5 font-semibold">{i + 1}. {qq.q}</p>
                {a === null ? <Ans ok={false} text="Not answered" /> : <Ans ok={ok} text={`Your answer: ${letters[a]}. ${qq.options[a]}`} />}
                {!ok && <Ans ok text={`Correct answer: ${letters[qq.answer]}. ${qq.options[qq.answer]}`} />}
                {qq.explanation && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2 text-sm text-info">
                    <Lightbulb className="mt-0.5 size-4 shrink-0" /><span>{qq.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Stat = ({ v, l, cls }: { v: React.ReactNode; l: string; cls?: string }) => (
  <div className="rounded-2xl bg-secondary p-3.5"><div className={cn('font-display text-2xl font-bold', cls)}>{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
);
const Ans = ({ ok, text }: { ok: boolean; text: string }) => (
  <div className={cn('mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm', ok ? 'bg-good-soft text-good' : 'bg-critical-soft text-critical')}>
    {ok ? <Check className="size-4 shrink-0" strokeWidth={2.4} /> : <X className="size-4 shrink-0" strokeWidth={2.4} />}{text}
  </div>
);
