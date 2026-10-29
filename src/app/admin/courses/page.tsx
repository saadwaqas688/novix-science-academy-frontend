'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, FileText, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AdminChapter, Book, SubjectSummary } from '@/lib/types';
import { SubjectIcon, subjectCover } from '@/lib/subjects';
import { cn, fmtSize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, CLASS_OPTIONS, Segmented } from '@/components/admin-ui';
import { Field } from '@/components/common';
import { useConfirm } from '@/components/confirm';

type Data = { subject: SubjectSummary; classLevel: string; book: Book | null; chapters: AdminChapter[] };

export default function CoursesAdmin() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [slug, setSlug] = useState('physics');
  const [cls, setCls] = useState('9');
  const [editing, setEditing] = useState<AdminChapter | null>(null);
  const [adding, setAdding] = useState(false);
  const bookInput = useRef<HTMLInputElement>(null);
  const subjects = useQuery({ queryKey: ['admin', 'subjects', cls], queryFn: () => api<{ subjects: SubjectSummary[] }>(`/admin/subjects?classLevel=${cls}`).then((r) => r.subjects) });
  const key = ['admin', 'chapters', slug, cls];
  const q = useQuery({ queryKey: key, queryFn: () => api<Data>(`/admin/subjects/${slug}/chapters?classLevel=${cls}`) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });

  const uploadBook = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('subjectSlug', slug); fd.append('classLevel', cls); fd.append('file', file); return api('/admin/books', { form: fd }); },
    onSuccess: () => { toast.success('Book uploaded'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const removeBook = useMutation({
    mutationFn: (id: number) => api(`/admin/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Book removed'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const removeChapter = useMutation({
    mutationFn: (id: number) => api(`/admin/chapters/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Chapter deleted'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const d = q.data;

  return (
    <>
      <AdminTop title="Courses & chapters" text="Upload books and notes, and link YouTube lectures" right={<Button size="sm" onClick={() => setAdding(true)}><Plus /> Add chapter</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(subjects.data || []).map((s) => (
          <button key={s.slug} onClick={() => setSlug(s.slug)} className={cn('flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-3 text-left font-bold transition sm:p-3.5', slug === s.slug && 'border-primary ring-4 ring-ring/25')}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: subjectCover(s.slug, s.color) }}><SubjectIcon icon={s.icon} className="size-5" /></span>
            <span className="min-w-0 text-sm sm:text-[15px]">{s.name}<small className="block text-xs font-medium text-muted-foreground">{s.chapterCount} chapters</small></span>
          </button>
        ))}
      </div>
      <Segmented value={cls} onChange={setCls} options={CLASS_OPTIONS} className="mb-4" />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3.5">
          <span className="grid h-16 w-14 shrink-0 place-items-center rounded-xl text-white" style={{ background: subjectCover(slug, d?.subject.color) }}><BookOpen className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold">Course book (PDF)</h4>
            <p className="truncate text-[13px] text-muted-foreground">{d?.book ? <a href={d.book.fileUrl} target="_blank" rel="noopener" className="text-brand-ink underline">{d.book.fileName}</a> : 'No book uploaded — students see "coming soon"'}{d?.book ? ` · ${fmtSize(d.book.sizeBytes)}` : ''}</p>
          </div>
          <input ref={bookInput} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBook.mutate(f); e.target.value = ''; }} />
          <Button size="sm" variant="secondary" disabled={uploadBook.isPending} onClick={() => bookInput.current?.click()}>{uploadBook.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {d?.book ? 'Replace' : 'Upload'} PDF</Button>
          {d?.book && <Button size="sm" variant="outline" aria-label="Remove book" onClick={async () => { if (await confirm({ title: 'Remove the book PDF?', confirmText: 'Remove', destructive: true })) removeBook.mutate(d.book!.id); }}><Trash2 /></Button>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {!d ? <Skeleton className="h-60" /> : d.chapters.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Chapter</TableHead><TableHead>Notes</TableHead><TableHead>Videos</TableHead><TableHead>Assessments</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.chapters.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell data-label="#" className="font-bold">{c.number}</TableCell>
                    <TableCell className="font-semibold max-md:block">{c.title}</TableCell>
                    <TableCell data-label="Notes">{c.notes ? <Badge variant="good"><FileText /> Uploaded</Badge> : <Badge>Coming soon</Badge>}</TableCell>
                    <TableCell data-label="Videos">{c.videos.length ? <Badge variant="good">{c.videos.length} linked</Badge> : <Badge>Coming soon</Badge>}</TableCell>
                    <TableCell data-label="Assessments">{c.assessmentCount ? <Badge variant="info">{c.assessmentCount} tests</Badge> : <Badge>None</Badge>}</TableCell>
                    <TableCell className="max-md:block">
                      <div className="flex flex-wrap justify-end gap-1.5 max-md:justify-start">
                        <Button size="xs" variant="secondary" onClick={() => setEditing(c)}><Pencil /> Edit content</Button>
                        <Button size="xs" variant="outline" asChild><Link href={`/admin/assessments/new?chapterId=${c.id}&subject=${slug}&classLevel=${cls}`}><Plus /> Test</Link></Button>
                        <Button size="xs" variant="outline" aria-label="Delete chapter" onClick={async () => {
                          if (await confirm({ title: `Delete chapter ${c.number}?`, description: 'Its notes, videos, assessments and results will also be deleted.', confirmText: 'Delete', destructive: true })) removeChapter.mutate(c.id);
                        }}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="py-12 text-center text-muted-foreground">No chapters for this class yet. Click “Add chapter”.</p>}
        </CardContent>
      </Card>

      {editing && <ChapterDialog chapter={editing} onClose={() => setEditing(null)} onSaved={refresh} subjectName={d?.subject.name || ''} cls={cls} />}
      <AddChapterDialog open={adding} onOpenChange={setAdding} slug={slug} cls={cls} onDone={refresh} />
    </>
  );
}

function AddChapterDialog({ open, onOpenChange, slug, cls, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string; cls: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const add = useMutation({
    mutationFn: () => api('/admin/chapters', { json: { subjectSlug: slug, classLevel: cls, title } }),
    onSuccess: () => { toast.success('Chapter added'); setTitle(''); onOpenChange(false); onDone(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add chapter</DialogTitle><DialogDescription>It will be added at the end of Class {cls}.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Field label="Chapter title"><Input required minLength={2} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={add.isPending}>Add</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type VRow = { title: string; youtubeUrl: string; duration: string };

function ChapterDialog({ chapter, onClose, onSaved, subjectName, cls }: { chapter: AdminChapter; onClose: () => void; onSaved: () => void; subjectName: string; cls: string }) {
  const [title, setTitle] = useState(chapter.title);
  const [notes, setNotes] = useState(chapter.notes);
  const [videos, setVideos] = useState<VRow[]>(chapter.videos.map((v) => ({ title: v.title, youtubeUrl: v.youtubeUrl, duration: v.duration || '' })));
  const file = useRef<HTMLInputElement>(null);

  const uploadNotes = useMutation({
    mutationFn: (f: File) => { const fd = new FormData(); fd.append('file', f); return api<{ notes: AdminChapter['notes'] }>(`/admin/chapters/${chapter.id}/notes`, { form: fd }); },
    onSuccess: (r) => { setNotes(r.notes); toast.success('Notes uploaded'); onSaved(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const removeNotes = useMutation({
    mutationFn: () => api(`/admin/chapters/${chapter.id}/notes`, { method: 'DELETE' }),
    onSuccess: () => { setNotes(null); toast.success('Notes removed'); onSaved(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const save = useMutation({
    mutationFn: async () => {
      if (title.trim() !== chapter.title) await api(`/admin/chapters/${chapter.id}`, { method: 'PATCH', json: { title } });
      const list = videos.filter((v) => v.title.trim() || v.youtubeUrl.trim());
      await api(`/admin/chapters/${chapter.id}/videos`, { method: 'PUT', json: { videos: list.map((v) => ({ ...v, duration: v.duration || null })) } });
    },
    onSuccess: () => { toast.success('Chapter saved'); onSaved(); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const setV = (i: number, k: keyof VRow, v: string) => setVideos(videos.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit chapter {chapter.number}</DialogTitle>
          <DialogDescription>{subjectName} · Class {cls}. Empty notes or videos show “Coming soon” to students.</DialogDescription>
        </DialogHeader>
        <Field label="Chapter title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="flex flex-col gap-1.5">
          <Label>Notes (PDF)</Label>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-input bg-secondary p-3.5">
            <FileText className="size-6 text-critical" />
            <div className="min-w-0 flex-1 text-sm">{notes ? <><a href={notes.fileUrl} target="_blank" rel="noopener" className="block truncate font-semibold text-brand-ink underline">{notes.fileName}</a><span className="text-xs text-muted-foreground">{fmtSize(notes.sizeBytes)}</span></> : <span className="text-muted-foreground">No notes uploaded</span>}</div>
            <input ref={file} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadNotes.mutate(f); e.target.value = ''; }} />
            <Button size="xs" variant="secondary" disabled={uploadNotes.isPending} onClick={() => file.current?.click()}>{uploadNotes.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {notes ? 'Replace' : 'Upload'}</Button>
            {notes && <Button size="xs" variant="outline" disabled={removeNotes.isPending} onClick={() => removeNotes.mutate()} aria-label="Remove notes"><Trash2 /></Button>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>YouTube video lectures</Label>
          {videos.map((v, i) => (
            <div key={i} className="grid gap-2 rounded-2xl border border-border p-2.5 sm:grid-cols-[1fr_1.3fr_80px_auto] sm:border-0 sm:p-0">
              <Input className="h-10" placeholder="Title" value={v.title} onChange={(e) => setV(i, 'title', e.target.value)} />
              <Input className="h-10" placeholder="https://youtube.com/watch?v=…" value={v.youtubeUrl} onChange={(e) => setV(i, 'youtubeUrl', e.target.value)} />
              <Input className="h-10" placeholder="12:30" value={v.duration} onChange={(e) => setV(i, 'duration', e.target.value)} />
              <Button size="icon" variant="outline" className="size-10" aria-label="Remove video" onClick={() => setVideos(videos.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          {!videos.length && <p className="text-sm text-muted-foreground">No videos yet.</p>}
          <Button size="sm" variant="secondary" className="self-start" onClick={() => setVideos([...videos, { title: '', youtubeUrl: '', duration: '' }])}><Plus /> Add YouTube link</Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save chapter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
