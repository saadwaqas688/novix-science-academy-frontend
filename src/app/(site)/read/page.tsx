'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Download } from 'lucide-react';
import { AuthGate, ErrorState, PageLoader } from '@/components/common';
import { PdfReader } from '@/components/pdf-reader';
import { Button } from '@/components/ui/button';
import { openOutside } from '@/lib/native';

/** In-app notes reader: /read?f=/chapter-notes/class-9/computer/ch-1.pdf&t=Title&back=/chapters/12 */
export default function ReadRoute() {
  return <AuthGate><Suspense fallback={<PageLoader />}><Reader /></Suspense></AuthGate>;
}

function Reader() {
  const sp = useSearchParams();
  const file = sp.get('f') || '';
  const title = sp.get('t') || 'Notes';
  const back = sp.get('back') || '/';
  const valid = /^\/[\w\-./]+\.pdf$/i.test(file) && !file.includes('..');
  if (!valid) return <ErrorState message="This notes file cannot be opened." />;
  const name = file.split('/').filter(Boolean).join('-');
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link href={back.startsWith('/') ? back : '/'} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-ink">
          <ChevronLeft className="size-4" /> Back
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold sm:text-2xl">{title}</h1>
        <Button asChild variant="outline" size="sm">
          <a href={file} download={name} onClick={(e) => openOutside(e, file)}><Download /> Download</a>
        </Button>
      </div>
      <PdfReader fileUrl={file} />
    </>
  );
}
