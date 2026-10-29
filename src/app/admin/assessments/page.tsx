'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AdminAssessmentRow } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, CLASS_OPTIONS, Segmented, SUBJECT_OPTIONS } from '@/components/admin-ui';
import { useConfirm } from '@/components/confirm';

export default function AssessmentsAdmin() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [subject, setSubject] = useState('all');
  const [cls, setCls] = useState('9');
  const q = useQuery({ queryKey: ['admin', 'assessments', subject, cls], queryFn: () => api<{ assessments: AdminAssessmentRow[] }>(`/admin/assessments?subject=${subject}&classLevel=${cls}`).then((r) => r.assessments) });
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/assessments/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Assessment deleted'); qc.invalidateQueries({ queryKey: ['admin'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const newHref = `/admin/assessments/new?subject=${subject === 'all' ? 'physics' : subject}&classLevel=${cls}`;

  return (
    <>
      <AdminTop title="Assessments" text="Topic-wise MCQ tests — each test has exactly 10 questions" right={<Button size="sm" asChild><Link href={newHref}><Plus /> New assessment</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Segmented value={subject} onChange={setSubject} options={[{ value: 'all', label: 'All' }, ...SUBJECT_OPTIONS.map((s) => ({ ...s, label: s.label.split(' ')[0] }))]} />
        <Segmented value={cls} onChange={setCls} options={CLASS_OPTIONS} />
      </div>
      <Card>
        <CardContent>
          {!q.data ? <Skeleton className="h-48" /> : q.data.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Topic</TableHead><TableHead>Subject</TableHead><TableHead>Chapter</TableHead><TableHead>Questions</TableHead><TableHead>Attempts</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {q.data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold max-md:block">{a.topic} {!a.published && <Badge variant="warning" className="ml-1">Hidden</Badge>}</TableCell>
                    <TableCell data-label="Subject"><span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold" style={{ background: `${a.subjectColor}1a`, color: a.subjectColor }}>{a.subjectName}</span></TableCell>
                    <TableCell data-label="Chapter">Ch {a.chapterNumber} · {a.chapterTitle}</TableCell>
                    <TableCell data-label="Questions">{a.questionCount} MCQs</TableCell>
                    <TableCell data-label="Attempts">{a.attemptCount}</TableCell>
                    <TableCell className="max-md:block">
                      <div className="flex justify-end gap-1.5 max-md:justify-start">
                        <Button size="xs" variant="secondary" asChild><Link href={`/admin/assessments/${a.id}`}><Pencil /> Edit</Link></Button>
                        <Button size="xs" variant="outline" aria-label="Delete" onClick={async () => {
                          if (await confirm({ title: `Delete “${a.topic}”?`, description: 'Students will no longer see this test and its results will be deleted.', confirmText: 'Delete', destructive: true })) del.mutate(a.id);
                        }}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No assessments for this filter yet.
              <div className="mt-4"><Button size="sm" asChild><Link href={newHref}><Plus /> Create one</Link></Button></div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
