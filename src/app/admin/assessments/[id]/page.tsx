'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EditableQuestion } from '@/lib/types';
import { AssessmentEditor } from '@/components/assessment-editor';
import { ErrorState, PageLoader } from '@/components/common';

type Resp = {
  assessment: { id: number; topic: string; published: boolean; chapterId: number; subjectSlug: string; classLevel: string };
  questions: EditableQuestion[];
};

export default function EditAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['admin', 'assessment', id], queryFn: () => api<Resp>(`/admin/assessments/${id}`), staleTime: 0 });
  if (q.error) return <ErrorState message={(q.error as Error).message} />;
  if (!q.data) return <PageLoader />;
  const a = q.data.assessment;
  return (
    <AssessmentEditor
      key={a.id}
      initial={{ id: a.id, subject: a.subjectSlug, classLevel: a.classLevel, chapterId: a.chapterId, topic: a.topic, published: a.published, questions: q.data.questions }}
    />
  );
}
