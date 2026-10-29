'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import { ClassLevelProvider } from '@/lib/class-level';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: (n, e: unknown) => n < 1 && (e as { status?: number })?.status !== 401 && (e as { status?: number })?.status !== 403, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ClassLevelProvider>
          {children}
          <Toaster />
        </ClassLevelProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
