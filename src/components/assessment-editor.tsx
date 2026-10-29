'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AdminChapter, EditableQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CLASS_OPTIONS, SUBJECT_OPTIONS } from '@/components/admin-ui';
import { Field } from '@/components/common';

export const QUESTIONS_PER_TEST = 10;
const blank = (): EditableQuestion[] => Array.from({ length: QUESTIONS_PER_TEST }, () => ({ text: '', options: ['', '', '', ''], correctIndex: null }));
const complete = (q: EditableQuestion) => !!q.text.trim() && q.options.every((o) => o.trim()) && q.correctIndex !== null;

export interface EditorInitial {
  id?: number; subject: string; classLevel: string; chapterId: number | null; topic: string; published: boolean; questions: EditableQuestion[];
}

export function AssessmentEditor({ initial }: { initial: EditorInitial }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [subject, setSubject] = useState(initial.subject);
  const [cls, setCls] = useState(initial.classLevel);
  const [chapterId, setChapterId] = useState<number | null>(initial.chapterId);
  const [topic, setTopic] = useState(initial.topic);
  const [published, setPublished] = useState(initial.published);
  const [qs, setQs] = useState<EditableQuestion[]>(initial.questions.length ? initial.questions : blank());

  const chapters = useQuery({
    queryKey: ['admin', 'chapters', subject, cls],
    queryFn: () => api<{ chapters: AdminChapter[] }>(`/admin/subjects/${subject}/chapters?classLevel=${cls}`).then((r) => r.chapters),
  });
  useEffect(() => {
    if (chapters.data && !chapters.data.some((c) => c.id === chapterId)) setChapterId(chapters.data[0]?.id ?? null);
  }, [chapters.data, chapterId]);

  const done = useMemo(() => qs.filter(complete).length, [qs]);
  const setQ = (i: number, patch: Partial<EditableQuestion>) => setQs(qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const save = useMutation({
    mutationFn: () => {
      const json = { chapterId, topic, published, questions: qs.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })) };
      return initial.id ? api(`/admin/assessments/${initial.id}`, { method: 'PUT', json }) : api('/admin/assessments', { json });
    },
    onSuccess: () => { toast.success('Assessment saved'); qc.invalidateQueries({ queryKey: ['admin'] }); router.push('/admin/assessments'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const onSave = () => {
    if (!chapterId) return toast.error('Please choose a chapter');
    if (!topic.trim()) return toast.error('Please enter a topic');
    const missing = qs.map((q, i) => (complete(q) ? 0 : i + 1)).filter(Boolean);
    if (missing.length) {
      toast.error(`Complete question${missing.length > 1 ? 's' : ''} ${missing.join(', ')} first`);
      document.getElementById(`q-${missing[0] - 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    save.mutate();
  };

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-2.5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:top-0">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/assessments')} aria-label="Back"><ChevronLeft /></Button>
        <h1 className="flex-1 text-xl font-extrabold sm:text-[22px]">{initial.id ? 'Edit' : 'New'} assessment</h1>
        <span className={cn('rounded-full px-3 py-1.5 text-[13px] font-bold', done === QUESTIONS_PER_TEST ? 'bg-good-soft text-good' : 'bg-warning-soft text-amber-700')}>{done}/{QUESTIONS_PER_TEST} complete</span>
        <Button size="sm" onClick={onSave} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Subject">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Class">
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLASS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Chapter">
              <Select value={chapterId ? String(chapterId) : ''} onValueChange={(v) => setChapterId(Number(v))} disabled={!chapters.data?.length}>
                <SelectTrigger><SelectValue placeholder={chapters.isLoading ? 'Loading…' : 'No chapters'} /></SelectTrigger>
                <SelectContent>{chapters.data?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.number}. {c.title}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <Field label="Topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. SI units and prefixes" /></Field>
            <label className="flex h-11 items-center gap-3 text-sm font-semibold"><Switch checked={published} onCheckedChange={setPublished} /> Visible to students</label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {qs.map((q, i) => {
          const ok = complete(q);
          return (
            <Card key={i} id={`q-${i}`} className={cn(ok && 'border-good/35')}>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between"><b className="text-sm">Question {i + 1}</b><Badge variant={ok ? 'good' : 'default'}>{ok ? 'Complete' : 'Incomplete'}</Badge></div>
                <Textarea className="min-h-20" placeholder="Type the question" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() => setQ(i, { correctIndex: j })}
                        className={cn('grid size-9 shrink-0 place-items-center rounded-xl border-[1.5px] border-input text-[13px] font-bold text-muted-foreground transition', q.correctIndex === j && 'border-good bg-good text-white')}
                      >{q.correctIndex === j ? <Check className="size-4" strokeWidth={3} /> : 'ABCD'[j]}</button>
                      <Input className="h-10" placeholder={`Option ${'ABCD'[j]}`} value={o} onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click the letter next to the correct option to mark it.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
