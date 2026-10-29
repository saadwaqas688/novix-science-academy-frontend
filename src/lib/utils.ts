import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const initials = (name: string) =>
  name.replace(/^(sir|miss|mr|mrs|ms|dr)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

export const fmtDate = (d: string | Date, withYear = true) =>
  new Date(d).toLocaleDateString('en-GB', withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });

export const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export const fmtSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const scoreTone = (score: number, total: number) => {
  const p = total ? score / total : 0;
  return p >= 0.8 ? 'good' : p >= 0.5 ? 'warning' : 'critical';
};
