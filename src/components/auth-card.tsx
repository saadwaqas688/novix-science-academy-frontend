import { cn } from '@/lib/utils';

export function AuthCard({ icon: Icon, title, text, children, center }: { icon: React.ElementType; title: string; text: string; children?: React.ReactNode; center?: boolean }) {
  return (
    <div className="grid min-h-[calc(100dvh-12rem)] place-items-center py-4">
      <div className={cn('glass w-full max-w-md rounded-3xl border border-border p-6 shadow-soft sm:p-8', center && 'text-center')}>
        <span className={cn('mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-logo text-white', center && 'mx-auto')}><Icon className="size-7" strokeWidth={2} /></span>
        <h1 className="mb-1.5 text-[28px] font-extrabold">{title}</h1>
        <p className="mb-6 text-muted-foreground">{text}</p>
        {children}
      </div>
    </div>
  );
}

export function Notice({ tone, icon: Icon, children }: { tone: 'info' | 'warn' | 'bad' | 'good'; icon: React.ElementType; children: React.ReactNode }) {
  const cls = { info: 'bg-info-soft text-info', warn: 'bg-warning-soft text-amber-700', bad: 'bg-critical-soft text-critical', good: 'bg-good-soft text-good' }[tone];
  return (
    <div className={cn('mb-5 flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-left text-[13.5px]', cls)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" /><div>{children}</div>
    </div>
  );
}
