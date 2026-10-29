'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { UserStatus } from '@/lib/types';

export function AdminTop({ title, text, right }: { title: string; text?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-[28px]">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      </div>
      {right && <div className="flex flex-wrap gap-2">{right}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cn('scrollbar-none inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-border bg-secondary p-1', className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold text-muted-foreground transition', value === o.value && 'bg-surface text-brand-ink shadow-sm')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={status === 'approved' ? 'good' : status === 'pending' ? 'warning' : 'critical'}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

export function ScoreBadge({ score, total }: { score: number; total: number }) {
  const p = total ? score / total : 0;
  return <Badge variant={p >= 0.8 ? 'good' : p >= 0.5 ? 'warning' : 'critical'}>{score}/{total}</Badge>;
}

export function Kpi({ icon: Icon, bg, value, label }: { icon: React.ElementType; bg: string; value: React.ReactNode; label: string }) {
  return (
    <div className="glass rounded-2xl border border-border p-4 shadow-soft sm:p-5">
      <div className={cn('mb-3 grid size-10 place-items-center rounded-xl text-white', bg)}><Icon className="size-5" /></div>
      <div className="font-display text-2xl leading-tight font-extrabold sm:text-[28px]">{value}</div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
    </div>
  );
}

export const SUBJECT_OPTIONS = [
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'math', label: 'Mathematics' },
  { value: 'computer', label: 'Computer Science' },
];
export const CLASS_OPTIONS = [
  { value: '9', label: 'Class 9' }, { value: '10', label: 'Class 10' }, { value: '11', label: 'Class 11' }, { value: '12', label: 'Class 12' },
];
