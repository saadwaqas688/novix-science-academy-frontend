import { BottomNav, SiteFooter, SiteHeader } from '@/components/site-shell';
import { ConfirmProvider } from '@/components/confirm';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-5 sm:pt-7 md:pb-16">{children}</main>
      <SiteFooter />
      <BottomNav />
    </ConfirmProvider>
  );
}
