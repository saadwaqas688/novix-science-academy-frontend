'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Check, ChevronLeft, Eye, RotateCcw, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { AttemptResult } from '@/lib/types';
import { cn, fmtDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { AuthGate, ErrorState, ScoreRing } from '@/components/common';

export default function ResultRoute() {
  return <AuthGate><Result /></AuthGate>;
}

function Result() {
  const { id } = useParams<{ id: string }>();
  const [showReview, setShowReview] = useState(false);
  const q = useQuery({ queryKey: ['attempt', id], queryFn: () => api<AttemptResult>(`/attempts/${id}`) });
  if (q.error) return <ErrorState message={(q.error as Error).message} />;
  if (!q.data) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  const { attempt: t, assessment: a, review } = q.data;
  const pct = t.total ? t.score / t.total : 0;
  const unanswered = review.filter((r) => r.answer === null).length;
  const msg = pct >= 0.8 ? 'Excellent work!' : pct >= 0.5 ? 'Good effort — keep practising' : 'Keep going — review the notes and try again';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass rounded-3xl border border-border p-6 text-center shadow-soft sm:p-8">
        <ScoreRing score={t.score} total={t.total} />
        <h1 className="mt-5 mb-1.5 text-2xl font-extrabold">{msg}</h1>
        <p className="text-muted-foreground">{a.topic} · {a.subject.name} · Chapter {a.chapter.number}</p>
        <div className="my-6 grid grid-cols-3 gap-2.5">
          <Stat v={t.score} l="Correct" cls="text-good" />
          <Stat v={t.total - t.score - unanswered} l="Wrong" cls="text-critical" />
          <Stat v={fmtDuration(t.durationSec)} l="Time" />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button asChild><Link href={`/test/${a.id}`}><RotateCcw /> Retake</Link></Button>
          <Button variant="outline" onClick={() => setShowReview(!showReview)}><Eye /> {showReview ? 'Hide' : 'Review'} answers</Button>
          <Button asChild variant="outline"><Link href="/progress"><BarChart3 /> Progress</Link></Button>
        </div>
        <Link href={`/chapters/${a.chapter.id}#assessments`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink"><ChevronLeft className="size-4" /> Back to chapter</Link>
      </div>

      {showReview && (
        <div className="mt-5 flex flex-col gap-3">
          {review.map((r, i) => (
            <div key={r.id} className="glass rounded-2xl border border-border p-4 shadow-soft sm:p-5">
              <p className="mb-2.5 font-semibold">{i + 1}. {r.text}</p>
              {r.answer === null
                ? <Ans ok={false} text="Not answered" />
                : <Ans ok={r.correct} text={`Your answer: ${r.options[r.answer]}`} />}
              {!r.correct && <Ans ok text={`Correct answer: ${r.options[r.correctIndex]}`} />}
            </div>
          ))}
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
