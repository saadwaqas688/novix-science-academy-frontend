import { ConfirmProvider } from '@/components/confirm';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <main className="mx-auto max-w-4xl px-4 pt-4 pb-32 sm:px-5 sm:pt-8 md:pb-12">{children}</main>
    </ConfirmProvider>
  );
}
