'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminAttempt } from '@/lib/types';
import { fmtDate, fmtDuration } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, ScoreBadge, Segmented, SUBJECT_OPTIONS } from '@/components/admin-ui';
import { Avatar } from '@/components/site-shell';

export default function ResultsAdmin() {
  const [subject, setSubject] = useState('all');
  const [q, setQ] = useState('');
  const r = useQuery({
    queryKey: ['admin', 'results', subject, q],
    queryFn: () => api<{ results: AdminAttempt[] }>(`/admin/results?subject=${subject}&q=${encodeURIComponent(q)}`).then((x) => x.results),
    placeholderData: (p) => p,
  });
  return (
    <>
      <AdminTop title="Results" text="Every assessment attempt by every student" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={subject} onChange={setSubject} options={[{ value: 'all', label: 'All' }, ...SUBJECT_OPTIONS.map((s) => ({ ...s, label: s.label.split(' ')[0] }))]} />
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-10" placeholder="Search student or topic" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent>
          {!r.data ? <Skeleton className="h-48" /> : r.data.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Assessment</TableHead><TableHead>Subject</TableHead><TableHead>Time</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-md:block"><div className="flex items-center gap-3"><Avatar name={t.userName} /><div className="min-w-0"><b className="block text-sm">{t.userName}</b><small className="text-xs text-muted-foreground">{t.userEmail}</small></div></div></TableCell>
                    <TableCell data-label="Assessment">{t.topic} · Ch {t.chapterNumber}</TableCell>
                    <TableCell data-label="Subject">{t.subjectName} · {t.classLevel}</TableCell>
                    <TableCell data-label="Time">{fmtDuration(t.durationSec)}</TableCell>
                    <TableCell data-label="Date">{fmtDate(t.createdAt)}</TableCell>
                    <TableCell data-label="Score" className="text-right"><ScoreBadge score={t.score} total={t.total} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="py-12 text-center text-muted-foreground">No results yet.</p>}
        </CardContent>
      </Card>
    </>
  );
}
