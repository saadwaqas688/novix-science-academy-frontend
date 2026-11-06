'use client';

import type { AttendanceMark } from '@/lib/types';
import { cn } from '@/lib/utils';

export const MARK_COLOR: Record<AttendanceMark, string> = { present: '#059669', absent: '#e11d48', leave: '#f59e0b' };
export const MARK_LABEL: Record<AttendanceMark, string> = { present: 'Present', absent: 'Absent', leave: 'Leave' };
export const MARK_SHORT: Record<AttendanceMark, string> = { present: 'P', absent: 'A', leave: 'L' };

/** "12 Nov 2026" from YYYY-MM-DD without timezone shifts. */
export const fmtDay = (d: string, withYear = true) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
};
export const pctOf = (present: number, marked: number) => (marked ? Math.round((present / marked) * 100) : null);
export const pctTone = (p: number | null) => (p === null ? 'text-muted-foreground' : p >= 85 ? 'text-good' : p >= 70 ? 'text-amber-600' : 'text-critical');

export function MarkDots({ marks, size = 'sm' }: { marks: AttendanceMark[]; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex gap-1">
      {marks.map((m, i) => (
        <span key={i} title={MARK_LABEL[m]} className={cn('grid place-items-center rounded-[5px] font-bold text-white', size === 'sm' ? 'size-[18px] text-[10px]' : 'size-6 text-[11px]')} style={{ background: MARK_COLOR[m] }}>{MARK_SHORT[m]}</span>
      ))}
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {(['present', 'absent', 'leave'] as AttendanceMark[]).map((m) => <span key={m} className="flex items-center gap-1.5"><i className="size-3 rounded-[4px]" style={{ background: MARK_COLOR[m] }} />{MARK_LABEL[m]}</span>)}
      <span className="flex items-center gap-1.5"><i className="size-3 rounded-[4px] border border-border bg-secondary" />No record</span>
    </div>
  );
}
