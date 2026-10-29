'use client';

import * as React from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { CLASSES, useClassLevel } from '@/lib/class-level';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export const APP_NAME = 'Novix Science Academy';

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5 font-display text-lg font-extrabold', dark ? 'text-white' : 'text-foreground', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-logo text-white shadow-[0_8px_18px_-8px_rgba(34,165,196,0.8)]">
        <GraduationCap className="size-5" strokeWidth={2.2} />
      </span>
      <span className="leading-tight">Novix<span className="hidden font-semibold opacity-70 sm:inline"> Science Academy</span></span>
    </Link>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
      <div className="flex items-center gap-3 text-sm font-medium"><Loader2 className="size-5 animate-spin text-primary" />{label}</div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-[30vh] place-items-center text-center">
      <div>
        <p className="font-semibold text-critical">{message}</p>
        {onRetry && <button onClick={onRetry} className="mt-3 text-sm font-semibold text-brand-ink underline">Try again</button>}
      </div>
    </div>
  );
}

/** Redirects to /login (or home) unless a suitable user is signed in. */
export function AuthGate({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!admin || user.role === 'admin');
  useEffect(() => {
    if (!ready || allowed) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else router.replace('/');
  }, [ready, allowed, user, router, pathname]);
  if (!ready || !allowed) return <PageLoader />;
  return <>{children}</>;
}

export function ClassSwitcher({ className, light }: { className?: string; light?: boolean }) {
  const { cls, setCls } = useClassLevel();
  return (
    <div className={cn('inline-flex gap-0.5 rounded-full border p-1', light ? 'border-white/20 bg-white/15' : 'border-border bg-secondary', className)}>
      {CLASSES.map((c) => (
        <button
          key={c.id}
          disabled={!c.available}
          title={c.available ? undefined : 'Coming soon'}
          onClick={() => setCls(c.id)}
          className={cn(
            'h-8 rounded-full px-3 text-[13px] font-semibold transition sm:px-4',
            light ? 'text-white/85' : 'text-muted-foreground',
            cls === c.id && (light ? 'bg-white text-foreground' : 'bg-surface text-brand-ink shadow-sm'),
            !c.available && 'cursor-not-allowed opacity-45',
          )}
        >
          <span className="sm:hidden">{c.id}th</span>
          <span className="hidden sm:inline">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ComingSoon({ icon: Icon, title = 'Coming soon', text }: { icon: React.ElementType; title?: string; text: string }) {
  return (
    <div className="glass rounded-2xl border border-border px-6 py-14 text-center shadow-soft">
      <div className="relative mx-auto mb-5 grid size-20 place-items-center rounded-[26px] bg-brand-wash text-brand-ink">
        <span className="absolute -inset-2 animate-spin-slow rounded-[32px] border-2 border-dashed border-primary/30" />
        <Icon className="size-9" strokeWidth={1.7} />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-critical">{error}</p>}
    </div>
  );
}

export function ScoreRing({ score, total, size = 168 }: { score: number; total: number; size?: number }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const color = pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--warning)' : 'var(--critical)';
  return (
    <div className="mx-auto grid place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(${color} ${pct}%, var(--secondary) 0)` }}>
      <div className="grid place-items-center rounded-full bg-surface text-center" style={{ width: size - 34, height: size - 34 }}>
        <div>
          <div className="font-display text-4xl leading-none font-extrabold">{score}/{total}</div>
          <div className="mt-1 text-xs text-muted-foreground">{pct}%</div>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ title, text, right, className }: { title: string; text?: string; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {text && <p className="mt-1 text-muted-foreground">{text}</p>}
      </div>
      {right}
    </div>
  );
}
