'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, BookOpen, Home, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn, initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/misc';
import { Logo } from '@/components/common';

const isActive = (path: string, key: string) =>
  key === '/' ? path === '/' : key === '/courses' ? /^\/(courses|chapters|results|quiz-result)/.test(path) : path.startsWith(key);

export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-gradient-accent font-display text-sm font-bold text-white', className)}>{initials(name)}</span>;
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const links = [{ href: '/', label: 'Home' }, { href: '/courses', label: 'Courses' }, ...(user ? [{ href: '/progress', label: 'My progress' }] : [])];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-[68px] sm:px-5">
        <Logo />
        <nav className="ml-3 hidden gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cn('rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground', isActive(path, l.href) && 'bg-brand-wash text-brand-ink')}>
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="flex-1" />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-border bg-surface py-1 pr-1 pl-1 outline-none sm:pr-4">
              <Avatar name={user.name} />
              <span className="hidden text-sm font-semibold sm:inline">{user.name.split(' ')[0]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'admin' && <DropdownMenuItem onSelect={() => router.push('/admin')}><LayoutDashboard />Admin panel</DropdownMenuItem>}
              <DropdownMenuItem onSelect={() => router.push('/profile')}><UserIcon />Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/progress')}><BarChart3 />My progress</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { logout(); router.push('/'); }}><LogOut />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/signup">Sign up</Link></Button>
            <Button asChild size="sm"><Link href="/login">Sign in</Link></Button>
          </div>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const path = usePathname();
  const items = [
    { href: '/', label: 'Home', icon: Home, key: '/' },
    { href: '/courses', label: 'Courses', icon: BookOpen, key: '/courses' },
    { href: user ? '/progress' : '/login', label: 'Progress', icon: BarChart3, key: '/progress' },
    { href: user ? '/profile' : '/login', label: user ? 'Profile' : 'Sign in', icon: UserIcon, key: user ? '/profile' : '/login' },
  ];
  return (
    <nav className="pb-safe fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="flex rounded-3xl border border-border bg-white/90 p-1.5 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        {items.map((it) => {
          const on = isActive(path, it.key);
          return (
            <Link key={it.label} href={it.href} className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold text-muted-foreground transition', on && 'bg-brand-wash text-brand-ink')}>
              <it.icon className="size-[22px]" strokeWidth={on ? 2.3 : 1.9} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto hidden max-w-6xl flex-wrap justify-between gap-3 border-t border-border px-5 py-7 text-[13px] text-muted-foreground md:flex">
      <span>© {new Date().getFullYear()} Novix Science Academy · For Federal Board (FBISE) students</span>
      <span>Physics · Chemistry · Mathematics · Computer Science</span>
    </footer>
  );
}
