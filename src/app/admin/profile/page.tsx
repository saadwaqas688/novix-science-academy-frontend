'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { Teacher } from '@/lib/types';
import { initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminTop } from '@/components/admin-ui';
import { Field, PageLoader } from '@/components/common';

export default function TeacherProfileAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['teacher'], queryFn: () => api<{ teacher: Teacher | null }>('/teacher').then((r) => r.teacher) });
  const [f, setF] = useState({ name: '', title: '', intro: '', highlights: '', years: '', students: '', results: '' });
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = q.data;
    if (t) setF({ name: t.name, title: t.title, intro: t.intro, highlights: t.highlights.join(', '), years: t.years, students: t.students, results: t.results });
  }, [q.data]);

  const onDone = (msg: string) => () => { toast.success(msg); qc.invalidateQueries({ queryKey: ['teacher'] }); };
  const save = useMutation({
    mutationFn: () => api('/admin/teacher', { method: 'PUT', json: { ...f, highlights: f.highlights.split(',').map((x) => x.trim()).filter(Boolean) } }),
    onSuccess: onDone('Profile saved — it is now shown on the home page'),
    onError: (e) => toast.error(errMsg(e)),
  });
  const upload = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('file', file); return api('/admin/teacher/photo', { form: fd }); },
    onSuccess: onDone('Photo updated'),
    onError: (e) => toast.error(errMsg(e)),
  });
  const removePhoto = useMutation({ mutationFn: () => api('/admin/teacher/photo', { method: 'DELETE' }), onSuccess: onDone('Photo removed'), onError: (e) => toast.error(errMsg(e)) });

  if (q.isLoading) return <PageLoader />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <AdminTop title="Teacher profile" text="This is shown on the home page of the app" right={<Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>} />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="grid gap-4">
            <Field label="Teacher name"><Input value={f.name} onChange={set('name')} /></Field>
            <Field label="Title / qualification line"><Input value={f.title} onChange={set('title')} /></Field>
            <Field label="Introduction"><Textarea rows={7} value={f.intro} onChange={set('intro')} /></Field>
            <Field label="Highlights (comma separated)"><Input value={f.highlights} onChange={set('highlights')} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Years teaching"><Input value={f.years} onChange={set('years')} /></Field>
              <Field label="Students"><Input value={f.students} onChange={set('students')} /></Field>
              <Field label="A-grade results"><Input value={f.results} onChange={set('results')} /></Field>
            </div>
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 size-32 rounded-[40px] bg-gradient-aurora p-1.5">
              <div className="grid size-full place-items-center overflow-hidden rounded-[36px] bg-gradient-to-br from-teal-50 to-indigo-200 font-display text-4xl font-extrabold text-indigo-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {q.data?.photoUrl ? <img src={q.data.photoUrl} alt="" className="size-full object-cover" /> : initials(f.name || 'T')}
              </div>
            </div>
            <b className="font-display text-lg">{f.name}</b>
            <p className="mt-1 mb-4 text-[13px] text-muted-foreground">{f.title}</p>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) upload.mutate(x); e.target.value = ''; }} />
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => file.current?.click()} disabled={upload.isPending}>{upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Upload photo</Button>
              {q.data?.photoUrl && <Button size="sm" variant="outline" onClick={() => removePhoto.mutate()} aria-label="Remove photo"><Trash2 /></Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
