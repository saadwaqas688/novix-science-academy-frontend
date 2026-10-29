'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronLeft, ChevronRight, FileText, Target, Video } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useClassLevel } from '@/lib/class-level';
import type { SubjectPage } from '@/lib/types';
import { SubjectIcon, subjectCover } from '@/lib/subjects';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { AuthGate, ClassSwitcher, ErrorState, SectionHeading } from '@/components/common';

export default function CoursePage() {
  return <AuthGate><Course /></AuthGate>;
}

function Course() {
  const { slug } = useParams<{ slug: string }>();
  const { cls } = useClassLevel();
  const q = useQuery({ queryKey: ['subject', slug, cls], queryFn: () => api<SubjectPage>(`/subjects/${slug}?classLevel=${cls}`) });
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  const d = q.data;
  const cover = subjectCover(slug, d?.subject.color);
  const pct = d && d.progress.total ? Math.round((d.progress.done / d.progress.total) * 100) : 0;

  return (
    <>
      <Link href="/courses" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink"><ChevronLeft className="size-4" /> All courses</Link>
      <section className="relative overflow-hidden rounded-[22px] p-5 text-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.6)] sm:rounded-[28px] sm:p-7" style={{ background: cover }}>
        <span className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 sm:size-[70px] sm:rounded-[22px]">
            {d ? <SubjectIcon icon={d.subject.icon} className="size-8 sm:size-9" /> : null}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-4xl">{d?.subject.name || ' '}</h1>
            <p className="opacity-90">Class {cls} · Federal Board{d ? ` · ${d.chapters.length} chapters` : ''}</p>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
          <ClassSwitcher light />
          <div className="flex flex-wrap items-center gap-3">
            {d && d.progress.total > 0 && (
              <div className="flex items-center gap-2.5 text-[13px] font-semibold">
                <div className="h-2 w-28 overflow-hidden rounded-full bg-white/25 sm:w-44"><div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} /></div>
                {d.progress.done}/{d.progress.total} tests done
              </div>
            )}
            {d?.book
              ? <Button asChild size="sm" variant="outline" className="border-white/30 bg-white/15 text-white hover:border-white hover:text-white"><a href={d.book.fileUrl} target="_blank" rel="noopener"><BookOpen /> Open book (PDF)</a></Button>
              : <Button size="sm" variant="outline" className="border-white/30 bg-white/15 text-white hover:text-white" onClick={() => toast.info('The book PDF will be uploaded soon')}><BookOpen /> Book: coming soon</Button>}
          </div>
        </div>
      </section>

      <SectionHeading className="mt-8" title="Chapters" text="Each chapter has notes, video lectures and MCQ assessments." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {q.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {d?.chapters.map((c) => (
          <Link key={c.id} href={`/chapters/${c.id}`} className="glass group flex items-start gap-3.5 rounded-2xl border border-border p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:p-[18px]">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(15,23,42,0.6)] sm:size-[52px]" style={{ background: cover }}>{c.number}</span>
            <div className="min-w-0 flex-1">
              <h3 className="mt-0.5 mb-2 text-[15.5px] leading-snug font-bold">{c.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Chip on={c.hasNotes} icon={FileText} text={c.hasNotes ? 'Notes' : 'Soon'} />
                <Chip on={c.videoCount > 0} icon={Video} text={c.videoCount ? String(c.videoCount) : 'Soon'} />
                <Chip on={c.assessmentCount > 0} info icon={Target} text={c.assessmentCount ? `${c.completedCount}/${c.assessmentCount} tests` : 'Soon'} />
              </div>
            </div>
            <ChevronRight className="size-5 self-center text-muted-foreground/60 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
        {d && !d.chapters.length && <p className="text-muted-foreground">Chapters for this class will be added soon.</p>}
      </div>
    </>
  );
}

function Chip({ on, info, icon: Icon, text }: { on: boolean; info?: boolean; icon: React.ElementType; text: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold', on ? (info ? 'bg-info-soft text-info' : 'bg-good-soft text-good') : 'bg-secondary text-slate-500')}>
      <Icon className="size-3" strokeWidth={2.2} />{text}
    </span>
  );
}
