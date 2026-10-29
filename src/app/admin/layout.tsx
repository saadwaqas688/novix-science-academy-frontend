'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ExternalLink, GraduationCap, Layers, LayoutGrid, LogOut, Menu, SlidersHorizontal, Target, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { AuthGate } from '@/components/common';
import { ConfirmProvider } from '@/components/confirm';
import { Avatar } from '@/components/site-shell';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users, badge: true },
  { section: 'Content' },
  { href: '/admin/courses', label: 'Courses & chapters', icon: Layers },
  { href: '/admin/assessments', label: 'Assessments', icon: Target },
  { href: '/admin/results', label: 'Results', icon: BarChart3 },
  { section: 'Academy' },
  { href: '/admin/profile', label: 'Teacher profile', icon: SlidersHorizontal },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate admin>
      <ConfirmProvider>
        <Shell>{children}</Shell>
      </ConfirmProvider>
    </AuthGate>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const counts = useQuery({ queryKey: ['admin', 'users', 'counts'], queryFn: () => api<{ counts: { pending: number } }>('/admin/users?status=pending').then((r) => r.counts), refetchInterval: 60_000 });
  const pending = counts.data?.pending || 0;
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col gap-1 overflow-y-auto bg-[#0b1220] px-3.5 py-5 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0', open ? 'translate-x-0 shadow-2xl' : '-translate-x-full')}>
        <Link href="/admin" className="flex items-center gap-2.5 px-2.5 pb-5 font-display text-lg font-extrabold text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-logo"><GraduationCap className="size-5" strokeWidth={2.2} /></span>
          <span className="leading-tight">Novix Academy<small className="block font-sans text-[11px] font-semibold tracking-widest text-teal-300">ADMIN PANEL</small></span>
        </Link>
        {NAV.map((n, i) => 'section' in n
          ? <div key={i} className="px-3 pt-4 pb-1.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase">{n.section}</div>
          : (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn('flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-[#111a2e] hover:text-slate-100', active(n.href) && 'bg-gradient-to-br from-teal-600/35 to-teal-600/10 text-white ring-1 ring-teal-400/25 ring-inset')}>
              <n.icon className="size-[19px]" />{n.label}
              {'badge' in n && pending > 0 && <span className="ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-amber-500 px-1.5 text-[11px] font-extrabold text-slate-900">{pending}</span>}
            </Link>
          ))}
        <Link href="/" className="mt-4 flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400 hover:bg-[#111a2e] hover:text-slate-100"><ExternalLink className="size-[19px]" />View student app</Link>
        <div className="mt-auto flex items-center gap-2.5 rounded-2xl bg-[#111a2e] p-3">
          <Avatar name={user?.name || 'A'} />
          <div className="min-w-0 flex-1"><b className="block truncate text-[13.5px] text-white">{user?.name}</b><small className="block truncate text-xs text-slate-500">{user?.email}</small></div>
          <button title="Sign out" onClick={() => { logout(); router.push('/login'); }} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><LogOut className="size-4" /></button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-border bg-surface" aria-label="Menu"><Menu className="size-5" /></button>
          <span className="font-display font-extrabold">Admin panel</span>
        </div>
        <main className="px-4 py-5 sm:px-7 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
