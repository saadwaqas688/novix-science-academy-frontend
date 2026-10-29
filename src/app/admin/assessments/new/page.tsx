'use client';

import { useEffect, useState } from 'react';
import { AssessmentEditor, type EditorInitial } from '@/components/assessment-editor';
import { PageLoader } from '@/components/common';

export default function NewAssessmentPage() {
  const [initial, setInitial] = useState<EditorInitial | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setInitial({
      subject: p.get('subject') || 'physics',
      classLevel: p.get('classLevel') || '9',
      chapterId: p.get('chapterId') ? Number(p.get('chapterId')) : null,
      topic: '', published: true, questions: [],
    });
  }, []);
  return initial ? <AssessmentEditor initial={initial} /> : <PageLoader />;
}
