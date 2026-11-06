'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarCheck, CalendarDays, Download, FileSpreadsheet, Loader2, Search, Trash2, Upload, UserCheck, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import type { AttendanceList } from '@/lib/types';
import { readAttendanceFile, templateCsv, type ParsedSheet } from '@/lib/attendance-sheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTop, Kpi } from '@/components/admin-ui';
import { useConfirm } from '@/components/confirm';
import { Avatar } from '@/components/site-shell';
import { Legend, MARK_COLOR, MARK_SHORT, MarkDots, fmtDay, pctOf, pctTone } from '@/components/attendance-ui';

const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export default function AttendancePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const list = useQuery({
    queryKey: ['admin', 'attendance', q],
    queryFn: () => api<AttendanceList>(`/admin/attendance/students?q=${encodeURIComponent(q)}`),
    placeholderData: (p) => p,
  });
  const clearAll = useMutation({
    mutationFn: () => api('/admin/attendance', { method: 'DELETE' }),
    onSuccess: () => { toast.success('Attendance register cleared'); qc.invalidateQueries({ queryKey: ['admin', 'attendance'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const d = list.data;
  const s = d?.summary;
  const overall = d ? pctOf(d.students.reduce((n, x) => n + x.present, 0), d.students.reduce((n, x) => n + x.present + x.absent + x.leave, 0)) : null;

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + templateCsv()], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-template.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <AdminTop
        title="Attendance"
        text="Upload the attendance register from Excel and see each student's record. These students are separate from app accounts."
        right={<>
          <Button size="sm" variant="outline" onClick={downloadTemplate}><Download /> Template</Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}><Upload /> Upload Excel</Button>
        </>}
      />

      {!d ? <Skeleton className="h-64" /> : !s?.students && !q ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-brand-wash text-brand-ink"><FileSpreadsheet className="size-8" /></span>
            <h3 className="mb-1 text-lg font-bold">No attendance uploaded yet</h3>
            <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">Make an Excel sheet with the student name in the first column and one column per date. Write <b>P</b> for present, <b>A</b> for absent and <b>L</b> for leave.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={downloadTemplate}><Download /> Download template</Button>
              <Button onClick={() => setUploadOpen(true)}><Upload /> Upload Excel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={Users} bg="bg-gradient-accent" value={s?.students ?? 0} label="Students" />
            <Kpi icon={CalendarDays} bg="bg-gradient-to-br from-indigo-500 to-indigo-700" value={s?.days ?? 0} label={s?.firstDate && s.latestDate ? `Days · ${fmtDay(s.firstDate, false)} – ${fmtDay(s.latestDate, false)}` : 'Days recorded'} />
            <Kpi icon={UserCheck} bg="bg-gradient-to-br from-emerald-500 to-emerald-700" value={overall === null ? '—' : `${overall}%`} label="Overall attendance" />
            <Kpi icon={UserX} bg="bg-gradient-to-br from-rose-500 to-rose-700" value={`${s?.latestDay.absent ?? 0} absent`} label={s?.latestDate ? `On ${fmtDay(s.latestDate, false)} · ${s.latestDay.present ?? 0} present` : 'Latest day'} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 pl-10" placeholder="Search student" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Legend />
          </div>

          <Card>
            <CardContent>
              {d.students.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Leave</TableHead><TableHead>Attendance</TableHead><TableHead>Last 10 days</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.students.map((x) => {
                      const p = pctOf(x.present, x.present + x.absent + x.leave);
                      return (
                        <TableRow key={x.id} className="cursor-pointer" onClick={() => router.push(`/admin/attendance/${x.id}`)}>
                          <TableCell className="max-md:block">
                            <Link href={`/admin/attendance/${x.id}`} className="group flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <Avatar name={x.name} />
                              <div className="min-w-0"><b className="block text-sm group-hover:text-brand-ink group-hover:underline">{x.name}</b><small className="text-xs text-muted-foreground">{x.groupName || '—'}{x.lastDate ? ` · last ${fmtDay(x.lastDate, false)}` : ''}</small></div>
                            </Link>
                          </TableCell>
                          <TableCell data-label="Present"><b className="text-good">{x.present}</b></TableCell>
                          <TableCell data-label="Absent"><b className="text-critical">{x.absent}</b></TableCell>
                          <TableCell data-label="Leave">{x.leave}</TableCell>
                          <TableCell data-label="Attendance">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary"><i className="block h-full rounded-full" style={{ width: `${p ?? 0}%`, background: (p ?? 0) >= 85 ? MARK_COLOR.present : (p ?? 0) >= 70 ? MARK_COLOR.leave : MARK_COLOR.absent }} /></div>
                              <b className={pctTone(p)}>{p === null ? '—' : `${p}%`}</b>
                            </div>
                          </TableCell>
                          <TableCell data-label="Last 10 days"><MarkDots marks={x.recent} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : <p className="py-12 text-center text-muted-foreground">No student matches “{q}”.</p>}
            </CardContent>
          </Card>
          {!!s?.students && (
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="outline" className="text-critical" disabled={clearAll.isPending} onClick={async () => {
                if (await confirm({ title: 'Clear the whole attendance register?', description: `This deletes all ${s.students} students and every attendance mark. You can upload the Excel sheet again later.`, confirmText: 'Clear everything', destructive: true })) clearAll.mutate();
              }}><Trash2 /> Clear register</Button>
            </div>
          )}
        </>
      )}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onDone={() => qc.invalidateQueries({ queryKey: ['admin', 'attendance'] })} />
    </>
  );
}

function UploadDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const read = async (f: File, m: string) => {
    setReading(true); setError(null); setSheet(null);
    try { setSheet(await readAttendanceFile(f, m)); } catch (e) { setError(errMsg(e)); } finally { setReading(false); }
  };
  const reset = () => { setFile(null); setSheet(null); setError(null); };
  const save = useMutation({
    mutationFn: () => api<{ studentsCreated: number; studentsUpdated: number; marksSaved: number }>('/admin/attendance/import', { json: { rows: sheet!.rows } }),
    onSuccess: (r) => {
      toast.success(`Saved ${r.marksSaved} marks · ${r.studentsCreated} new and ${r.studentsUpdated} existing students`);
      reset(); onOpenChange(false); onDone();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const preview = sheet ? sheet.dates.slice(-8) : [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload attendance</DialogTitle>
          <DialogDescription>Excel (.xlsx) or CSV. First column: student name. Then one column per date with P / A / L. Uploading the same date again replaces the old mark.</DialogDescription>
        </DialogHeader>

        <input ref={input} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); read(f, month); } e.target.value = ''; }} />
        <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-input bg-secondary p-4 text-left transition hover:border-primary">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white"><FileSpreadsheet className="size-6" /></span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-sm">{file ? file.name : 'Choose Excel file'}</b>
            <small className="text-xs text-muted-foreground">{file ? 'Click to choose a different file' : '.xlsx or .csv'}</small>
          </span>
          {reading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Upload className="size-5 text-muted-foreground" />}
        </button>

        {sheet?.dayOnlyHeaders && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
            <CalendarCheck className="size-4 shrink-0" />
            <span className="flex-1">The date columns only have day numbers. Which month are they?</span>
            <Input type="month" className="h-9 w-44" value={month} onChange={(e) => { setMonth(e.target.value); if (file && e.target.value) read(file, e.target.value); }} />
          </div>
        )}

        {error && <div className="flex gap-2 rounded-2xl bg-critical-soft p-3 text-sm font-medium text-critical"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}

        {sheet && (
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
              <span className="rounded-full bg-secondary px-3 py-1"><b>{sheet.rows.length}</b> students</span>
              <span className="rounded-full bg-secondary px-3 py-1"><b>{sheet.dates.length}</b> dates · {fmtDay(sheet.dates[0], false)} – {fmtDay(sheet.dates[sheet.dates.length - 1])}</span>
              <span className="rounded-full bg-good-soft px-3 py-1 text-good"><b>{sheet.counts.present}</b> present</span>
              <span className="rounded-full bg-critical-soft px-3 py-1 text-critical"><b>{sheet.counts.absent}</b> absent</span>
              {sheet.counts.leave > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700"><b>{sheet.counts.leave}</b> leave</span>}
            </div>
            {sheet.skippedCells > 0 && <p className="mb-3 flex gap-2 text-[13px] text-amber-700"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{sheet.skippedCells} cells were not understood and will be skipped ({sheet.unknownValues.map((v) => `“${v}”`).join(', ')}). Use P, A or L.</p>}
            <div className="max-h-64 overflow-auto rounded-xl border border-border">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-secondary"><tr><th className="px-3 py-2 text-left">Student</th>{preview.map((dt) => <th key={dt} className="px-1.5 py-2 text-center font-semibold whitespace-nowrap">{fmtDay(dt, false)}</th>)}</tr></thead>
                <tbody>
                  {sheet.rows.slice(0, 50).map((r, i) => {
                    const m = new Map(r.records.map((x) => [x.date, x.status]));
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 font-semibold whitespace-nowrap">{r.name}{r.group && <span className="font-normal text-muted-foreground"> · {r.group}</span>}</td>
                        {preview.map((dt) => { const v = m.get(dt); return <td key={dt} className="px-1.5 py-1.5 text-center">{v ? <span className={cn('inline-grid size-5 place-items-center rounded-[5px] text-[10px] font-bold text-white')} style={{ background: MARK_COLOR[v] }}>{MARK_SHORT[v]}</span> : <span className="text-muted-foreground">·</span>}</td>; })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(sheet.rows.length > 50 || sheet.dates.length > 8) && <p className="mt-2 text-xs text-muted-foreground">Preview shows {Math.min(50, sheet.rows.length)} students and the last {preview.length} dates. Everything will be saved.</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!sheet || save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Save attendance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
