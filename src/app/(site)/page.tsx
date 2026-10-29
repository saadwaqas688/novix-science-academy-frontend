'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, BookOpen, Check, FileText, GraduationCap, Target, Users, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useClassLevel } from '@/lib/class-level';
import type { SubjectSummary, Teacher } from '@/lib/types';
import { initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { BookCard } from '@/components/book-card';
import { ClassSwitcher, SectionHeading } from '@/components/common';

export default function HomePage() {
  const { user } = useAuth();
  const { cls } = useClassLevel();
  const teacher = useQuery({ queryKey: ['teacher'], queryFn: () => api<{ teacher: Teacher | null }>('/teacher').then((r) => r.teacher) });
  const subjects = useQuery({ queryKey: ['subjects', cls], queryFn: () => api<{ subjects: SubjectSummary[] }>(`/subjects?classLevel=${cls}`).then((r) => r.subjects) });
  const t = teacher.data;

  return (
    <>
      <section className="grid items-center gap-10 py-4 text-center lg:grid-cols-[420px_1fr] lg:gap-14 lg:py-8 lg:text-left">
        <div className="relative justify-self-center">
          <div className="size-64 animate-blob rounded-[44%_56%_52%_48%/50%_44%_56%_50%] bg-gradient-aurora p-2.5 shadow-[0_40px_80px_-30px_rgba(79,70,229,0.45)] sm:size-[360px]">
            <div className="relative grid size-full place-items-center overflow-hidden rounded-[inherit] bg-gradient-to-br from-teal-50 to-indigo-200">
              {t?.photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.photoUrl} alt={t.name} className="size-full object-cover" />
                : <span className="text-gradient-aurora font-display text-7xl font-extrabold sm:text-8xl">{t ? initials(t.name) : ''}</span>}
            </div>
          </div>
          {t?.results && (
            <div className="absolute top-3 -left-4 flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2 text-left text-xs font-semibold shadow-lift sm:top-7 sm:-left-8 sm:text-[13px]">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-accent text-white"><Award className="size-4" /></span>
              <div>{t.results} A-grades<div className="text-[11px] font-medium text-muted-foreground">Board results</div></div>
            </div>
          )}
          {t?.students && (
            <div className="absolute -right-3 bottom-5 flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2 text-left text-xs font-semibold shadow-lift sm:-right-8 sm:bottom-10 sm:text-[13px]">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Users className="size-4" /></span>
              <div>{t.students}<div className="text-[11px] font-medium text-muted-foreground">Students taught</div></div>
            </div>
          )}
        </div>

        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-wash px-3 py-1.5 text-xs font-bold tracking-wider text-brand-ink uppercase">
            <GraduationCap className="size-4" /> Federal Board · FBISE
          </span>
          {teacher.isLoading ? (
            <div className="mt-4 space-y-3"><Skeleton className="mx-auto h-12 w-3/4 lg:mx-0" /><Skeleton className="h-24 w-full" /></div>
          ) : t ? (
            <>
              <h1 className="text-gradient-aurora mt-4 mb-1.5 text-4xl font-extrabold sm:text-5xl lg:text-[56px]">{t.name}</h1>
              <p className="mb-3.5 font-semibold text-ink-2 sm:text-base">{t.title}</p>
              <p className="mx-auto mb-5 max-w-2xl text-muted-foreground sm:text-base lg:mx-0">{t.intro}</p>
              {!!t.highlights.length && (
                <div className="mb-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {t.highlights.map((h) => <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-brand-wash px-3 py-1 text-xs font-semibold text-brand-ink"><Check className="size-3.5" strokeWidth={2.6} />{h}</span>)}
                </div>
              )}
              <div className="mx-auto mb-7 grid max-w-lg grid-cols-3 gap-2.5 sm:gap-3 lg:mx-0">
                {[[t.years, 'Years teaching'], [t.students, 'Students'], ['4', 'Subjects']].map(([v, l]) => (
                  <div key={l} className="rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4">
                    <div className="font-display text-xl font-extrabold text-brand-ink sm:text-2xl">{v || '—'}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2.5 lg:justify-start">
            <Button asChild><a href="#courses"><BookOpen /> Explore courses</a></Button>
            {user
              ? <Button asChild variant="outline"><Link href="/progress"><BarChart3 /> My progress</Link></Button>
              : <Button asChild variant="outline"><Link href="/signup">Create account</Link></Button>}
          </div>
        </div>
      </section>

      <section id="courses" className="scroll-mt-24 pt-8">
        <SectionHeading title="Courses" text={`Tap a book to open its chapters${user ? '' : ' — you will be asked to sign in'}.`} right={<ClassSwitcher />} />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {subjects.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)
            : subjects.data?.map((s) => <BookCard key={s.slug} s={s} cls={cls} locked={!user} />)}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { icon: FileText, t: 'Chapter notes', d: 'Clean, exam-focused notes for every chapter, ready to read or download as PDF.', bg: 'bg-gradient-accent' },
          { icon: Video, t: 'Video lectures', d: 'Short YouTube lectures that explain each concept and solve numericals step by step.', bg: 'bg-gradient-to-br from-red-500 to-red-700' },
          { icon: Target, t: 'MCQ assessments', d: 'Topic-wise tests of 10 MCQs with instant results and a progress history for every attempt.', bg: 'bg-gradient-to-br from-indigo-500 to-violet-600' },
        ].map((f) => (
          <div key={f.t} className="glass rounded-2xl border border-border p-5 shadow-soft">
            <div className={`mb-3.5 grid size-11 place-items-center rounded-xl text-white ${f.bg}`}><f.icon className="size-5" /></div>
            <h3 className="mb-1 text-lg font-bold">{f.t}</h3>
            <p className="text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
