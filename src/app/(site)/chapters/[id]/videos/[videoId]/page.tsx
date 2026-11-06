'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, ExternalLink, FileText, Play, RotateCcw, Target, Video } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { ChapterPage } from '@/lib/types';
import { subjectCover } from '@/lib/subjects';
import { cn, youtubeId, youtubeThumb } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { AuthGate, ComingSoon, ErrorState } from '@/components/common';
import { YouTubePlayer } from '@/components/youtube-player';

export default function VideoRoute() {
  return <AuthGate><Lecture /></AuthGate>;
}

function Lecture() {
  const { id, videoId } = useParams<{ id: string; videoId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['chapter', id], queryFn: () => api<ChapterPage>(`/chapters/${id}`) });
  const [endedId, setEndedId] = useState<number | null>(null);
  const [replay, setReplay] = useState(0);
  const watch = useMutation({
    mutationFn: ({ vid, on }: { vid: number; on: boolean }) => api(`/me/videos/${vid}/watched`, { method: on ? 'POST' : 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chapter', id] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!q.data) return <div className="grid gap-5 lg:grid-cols-[1fr_340px]"><Skeleton className="aspect-video" /><Skeleton className="h-80" /></div>;
  const { chapter, subject, videos } = q.data;
  const k = videos.findIndex((v) => String(v.id) === videoId);
  const back = (
    <Link href={`/chapters/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink">
      <ChevronLeft className="size-4" /> Ch {chapter.number} · {chapter.title}
    </Link>
  );
  if (k < 0) return <>{back}<ComingSoon icon={Video} title="Lecture not found" text="This lecture was removed or moved. Go back to the chapter to see all lectures." /></>;

  const v = videos[k];
  const yt = youtubeId(v.youtubeUrl);
  const prev = videos[k - 1];
  const next = videos[k + 1];
  const done = videos.filter((x) => x.watched).length;
  const cover = subjectCover(subject.slug, subject.color);
  const href = (vid: number) => `/chapters/${id}/videos/${vid}`;
  const onEnded = () => {
    setEndedId(v.id);
    if (!v.watched) watch.mutate({ vid: v.id, on: true });
  };

  return (
    <>
      {back}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="relative">
            {yt ? <YouTubePlayer key={`${v.id}-${replay}`} videoId={yt} title={v.title} onEnded={onEnded} /> : (
              <div className="grid aspect-video place-items-center rounded-2xl p-6 text-center text-white" style={{ background: cover }}>
                <div><p className="mb-3 font-semibold">This link cannot be played inside the app.</p>
                  <Button asChild variant="secondary"><a href={v.youtubeUrl} target="_blank" rel="noopener"><ExternalLink /> Open on YouTube</a></Button></div>
              </div>
            )}
            {endedId === v.id && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/75 p-4 text-center text-white backdrop-blur-sm">
                <div>
                  <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-good"><Check className="size-6" /></span>
                  <p className="mb-1 font-display text-lg font-bold">Lecture complete</p>
                  {next && <p className="mb-4 text-sm text-white/75">Up next: {next.title}</p>}
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" className="bg-transparent text-white hover:bg-white/10" onClick={() => { setEndedId(null); setReplay((n) => n + 1); }}><RotateCcw /> Replay</Button>
                    {next
                      ? <Button onClick={() => { setEndedId(null); router.push(href(next.id)); }}><Play /> Play next</Button>
                      : <Button asChild><Link href={`/chapters/${id}#assessments`}><Target /> Take a quiz</Link></Button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-0.5 pt-4">
            <Badge variant="brand"><Video className="size-3" /> Lecture {k + 1} of {videos.length}</Badge>
            <h1 className="mt-2 text-xl font-extrabold sm:text-2xl">{v.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subject.name} · Class {chapter.classLevel} · Chapter {chapter.number}: {chapter.title}{v.duration ? ` · ${v.duration}` : ''}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={v.watched ? 'secondary' : 'default'} disabled={watch.isPending} onClick={() => watch.mutate({ vid: v.id, on: !v.watched })}>
                <Check /> {v.watched ? 'Watched' : 'Mark as watched'}
              </Button>
              <Button asChild size="sm" variant="outline"><a href={v.youtubeUrl} target="_blank" rel="noopener"><ExternalLink /> Watch on YouTube</a></Button>
              <span className="flex-1" />
              {prev ? <Button asChild size="sm" variant="outline"><Link href={href(prev.id)}><ChevronLeft /> Previous</Link></Button> : <Button size="sm" variant="outline" disabled><ChevronLeft /> Previous</Button>}
              {next ? <Button asChild size="sm" variant="outline"><Link href={href(next.id)}>Next <ChevronRight /></Link></Button> : <Button size="sm" variant="outline" disabled>Next <ChevronRight /></Button>}
            </div>
          </div>

          <div className="glass mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4 shadow-soft sm:px-5">
            <div className="min-w-[200px] flex-1"><b>Done with this lecture?</b><p className="text-[13px] text-muted-foreground">Revise the notes or test yourself with this chapter&apos;s MCQs.</p></div>
            <Button asChild size="sm" variant="outline"><Link href={`/chapters/${id}`}><FileText /> Notes</Link></Button>
            <Button asChild size="sm"><Link href={`/chapters/${id}#assessments`}><Target /> Take a quiz</Link></Button>
          </div>
        </div>

        <aside className="glass rounded-2xl border border-border p-4 shadow-soft lg:sticky lg:top-24">
          <div className="mb-2.5 flex items-center justify-between"><h3 className="font-bold">Chapter lectures</h3><span className="text-[12.5px] text-muted-foreground">{done}/{videos.length} watched</span></div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary"><i className="block h-full rounded-full bg-gradient-accent transition-all" style={{ width: `${(done / videos.length) * 100}%` }} /></div>
          <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
            {videos.map((x, j) => {
              const th = youtubeThumb(x.youtubeUrl);
              return (
                <Link key={x.id} href={href(x.id)} className={cn('flex items-center gap-3 rounded-xl p-2 transition hover:bg-secondary', j === k && 'bg-brand-wash hover:bg-brand-wash')}>
                  <span className="relative grid aspect-video w-[118px] shrink-0 place-items-center overflow-hidden rounded-lg bg-cover bg-center text-white" style={{ background: th ? `center/cover url(${th})` : cover }}>
                    {x.watched ? <span className="absolute inset-0 grid place-items-center bg-teal-700/60"><Check className="size-5" /></span> : <Play className="size-4 fill-current drop-shadow" />}
                    {x.duration && <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10.5px]">{x.duration}</span>}
                  </span>
                  <span className="min-w-0">
                    <b className="line-clamp-2 text-[13.5px] leading-snug">{x.title}</b>
                    <small className={cn('text-xs', j === k ? 'font-bold text-brand-ink' : 'text-muted-foreground')}>{j === k ? 'Now playing' : x.watched ? 'Watched' : `Lecture ${j + 1}`}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}
