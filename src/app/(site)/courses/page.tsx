'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useClassLevel } from '@/lib/class-level';
import type { SubjectSummary } from '@/lib/types';
import { Skeleton } from '@/components/ui/misc';
import { BookCard } from '@/components/book-card';
import { ClassSwitcher, SectionHeading } from '@/components/common';

export default function CoursesPage() {
  const { user } = useAuth();
  const { cls } = useClassLevel();
  const q = useQuery({ queryKey: ['subjects', cls], queryFn: () => api<{ subjects: SubjectSummary[] }>(`/subjects?classLevel=${cls}`).then((r) => r.subjects) });
  return (
    <>
      <SectionHeading title="All courses" text="Books for Federal Board (FBISE) — choose your class." right={<ClassSwitcher />} />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {q.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)
          : q.data?.map((s) => <BookCard key={s.slug} s={s} cls={cls} locked={!user} />)}
      </div>
    </>
  );
}
