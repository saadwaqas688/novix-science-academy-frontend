'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { SubjectSummary } from '@/lib/types';
import { SubjectIcon, subjectCover } from '@/lib/subjects';

export function BookCard({ s, cls, locked }: { s: SubjectSummary; cls: string; locked: boolean }) {
  return (
    <Link href={`/courses/${s.slug}`} className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1.5">
      <div
        className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-[10px_18px_18px_10px] p-4 pl-6 text-white shadow-[0_26px_40px_-22px_rgba(15,23,42,0.55),inset_-8px_0_18px_-10px_rgba(0,0,0,0.25)] sm:p-5 sm:pl-8"
        style={{ background: subjectCover(s.slug, s.color) }}
      >
        <span className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/30 via-white/10 to-black/10" />
        <span className="absolute -top-10 -right-10 size-44 rounded-full bg-white/12" />
        <span className="grid size-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm sm:size-14">
          <SubjectIcon icon={s.icon} className="size-7 sm:size-8" />
        </span>
        {locked && <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-black/20" title="Sign in required"><Lock className="size-3.5" /></span>}
        <span className="mt-auto font-display text-xl leading-none font-extrabold sm:text-[26px]">{s.name}</span>
        <span className="mt-1.5 text-xs opacity-90">Class {cls} · FBISE</span>
        <span className="absolute right-3 bottom-3 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider">BOOK</span>
      </div>
      <div>
        <div className="font-display text-base font-bold sm:text-[17px]">{s.name}</div>
        <div className="text-[13px] text-muted-foreground">{s.chapterCount} chapters · Notes · Videos · MCQs</div>
      </div>
    </Link>
  );
}
