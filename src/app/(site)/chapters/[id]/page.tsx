'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, Download, ExternalLink, Eye, FileText, ListChecks, Play, Target, Video } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChapterPage } from '@/lib/types';
import { subjectCover } from '@/lib/subjects';
import { staticNotes } from '@/lib/static-notes';
import { chapterQuizzes, quizHref, quizKey } from '@/lib/quizzes';
import type { QuizBest } from '@/lib/types';
import { fmtSize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGate, ComingSoon, ErrorState } from '@/components/common';

export default function ChapterRoute() {
  return <AuthGate><Chapter /></AuthGate>;
}

function Chapter() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['chapter', id], queryFn: () => api<ChapterPage>(`/chapters/${id}`) });
  const d = q.data;
  const staticList = d ? chapterQuizzes(d.subject.slug, d.chapter.classLevel, d.chapter.number) : [];
  const qr = useQuery({
    queryKey: ['quiz-results', d?.subject.slug, d?.chapter.classLevel, d?.chapter.number],
    queryFn: () => api<{ results: QuizBest[] }>(`/quiz-results?subject=${d!.subject.slug}&classLevel=${d!.chapter.classLevel}&chapterNumber=${d!.chapter.number}`).then((r) => r.results),
    enabled: staticList.length > 0,
  });
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!q.data) return <div className="space-y-4"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-12" /><Skeleton className="h-48" /></div>;
  const { chapter, subject, videos, assessments } = q.data;
  const notesList = q.data.notes ? [{ ...q.data.notes, title: 'Chapter notes' }] : staticNotes(subject.slug, chapter.classLevel, chapter.number);
  const cover = subjectCover(subject.slug, subject.color);
  const tests = [
    ...assessments.map((a) => ({ key: `t${a.id}`, topic: a.topic, count: a.questionCount, best: a.bestScore, attempts: a.attemptCount, href: `/test/${a.id}` })),
    ...staticList.map((m) => {
      const k = quizKey(chapter.classLevel, subject.slug, chapter.number, m.id);
      const r = qr.data?.find((x) => x.quizKey === k);
      return { key: k, topic: m.topic, count: m.count, best: r ? r.best : null, attempts: r?.count ?? 0, href: quizHref(k) };
    }),
  ];
  const defaultTab = typeof window !== 'undefined' && window.location.hash === '#assessments' ? 'assessments' : 'notes';

  return (
    <>
      <Link href={`/courses/${subject.slug}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink">
        <ChevronLeft className="size-4" /> {subject.name} · Class {chapter.classLevel}
      </Link>
      <div className="mb-3 flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold text-white sm:size-[60px] sm:text-2xl" style={{ background: cover }}>{chapter.number}</span>
        <div>
          <h1 className="text-xl font-extrabold sm:text-3xl">{chapter.title}</h1>
          <p className="text-sm text-muted-foreground">{subject.name} · Chapter {chapter.number}</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="sticky top-16 z-20 -mx-4 bg-background/90 px-4 backdrop-blur-xl sm:top-[68px] sm:mx-0 sm:px-0">
          <TabsTrigger value="notes"><FileText /> Notes</TabsTrigger>
          <TabsTrigger value="videos"><Video /> Videos <Count n={videos.length} /></TabsTrigger>
          <TabsTrigger value="assessments"><Target /> Assessments <Count n={tests.length} /></TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          {notesList.length ? (
            <div className="space-y-3">
              {notesList.map((notes) => (
                <div key={notes.fileUrl} className="glass flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4 shadow-soft sm:p-5">
                  <span className="grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-300 to-red-500 text-xs font-extrabold text-white">PDF</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold">{notes.title}</h4>
                    <p className="truncate text-[13px] text-muted-foreground">{notes.fileName} · {fmtSize(notes.sizeBytes)}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button asChild variant="secondary" size="sm" className="flex-1 sm:flex-none"><a href={notes.fileUrl} target="_blank" rel="noopener"><Eye /> Read</a></Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none"><a href={notes.fileUrl} download={notes.fileName}><Download /> Download</a></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : <ComingSoon icon={FileText} text="Notes for this chapter are being prepared and will be uploaded soon." />}
        </TabsContent>

        <TabsContent value="videos">
          {videos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <a key={v.id} href={v.youtubeUrl} target="_blank" rel="noopener" className="glass group overflow-hidden rounded-2xl border border-border shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="relative grid aspect-video place-items-center" style={{ background: cover }}>
                    <span className="absolute top-2.5 left-2.5 rounded bg-red-600 px-1.5 py-0.5 text-[10.5px] font-bold text-white">YouTube</span>
                    <span className="grid size-14 place-items-center rounded-full bg-white/95 text-red-600 shadow-xl transition group-hover:scale-110"><Play className="size-6 fill-current" /></span>
                    {v.duration && <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11.5px] text-white">{v.duration}</span>}
                  </div>
                  <div className="p-4">
                    <h4 className="mb-1 font-bold">{v.title}</h4>
                    <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><ExternalLink className="size-3.5" /> Watch on YouTube</span>
                  </div>
                </a>
              ))}
            </div>
          ) : <ComingSoon icon={Video} text="Video lectures for this chapter will be added soon." />}
        </TabsContent>

        <TabsContent value="assessments">
          {tests.length ? (
            <div className="flex flex-col gap-3">
              {tests.map((a, i) => (
                <div key={a.key} className="glass flex flex-wrap items-center gap-3.5 rounded-2xl border border-border p-4 shadow-soft sm:flex-nowrap sm:gap-4 sm:px-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-wash font-display font-extrabold text-brand-ink">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold">{a.topic}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12.5px] text-muted-foreground">
                      <span className="flex items-center gap-1"><ListChecks className="size-3.5" /> {a.count} MCQs</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> ~{a.count} min</span>
                      {a.best !== null
                        ? <><Badge variant={a.best / a.count >= 0.8 ? 'good' : a.best / a.count >= 0.5 ? 'warning' : 'critical'}>Best {a.best}/{a.count}</Badge><span>{a.attempts} attempt{a.attempts > 1 ? 's' : ''}</span></>
                        : <Badge>Not attempted</Badge>}
                    </div>
                  </div>
                  <Button asChild size="sm" variant={a.best !== null ? 'outline' : 'default'} className="w-full sm:w-auto">
                    <Link href={a.href}>{a.best !== null ? 'Retake' : 'Start'} <ChevronRight /></Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : <ComingSoon icon={Target} text="Topic-wise assessments for this chapter will be published soon." />}
        </TabsContent>
      </Tabs>
    </>
  );
}

const Count = ({ n }: { n: number }) => <span className="rounded-full bg-secondary px-2 text-[11.5px]">{n}</span>;
