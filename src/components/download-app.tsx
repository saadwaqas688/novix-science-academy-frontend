'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { APK_INFO_URL, APK_URL, useIsNativeApp } from '@/lib/native';
import { cn, fmtSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Info = { version: string; sizeBytes: number; builtAt: string };

function useAppInfo() {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    fetch(APK_INFO_URL, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then(setInfo).catch(() => setInfo(null));
  }, []);
  return info;
}

const AndroidIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.6 9.48 19.44 6.3a.38.38 0 0 0-.66-.38l-1.86 3.22a11.5 11.5 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
  </svg>
);

/** Small "Download App" button for the header. Hidden inside the app itself. */
export function DownloadAppHeaderButton({ className }: { className?: string }) {
  const inApp = useIsNativeApp();
  if (inApp) return null;
  return (
    <Button asChild size="sm" variant="outline" className={cn('gap-1.5', className)}>
      <a href={APK_URL} download="Novix-Academy.apk"><AndroidIcon className="size-4 text-[#3ddc84]" /> Download App</a>
    </Button>
  );
}

/** Big card on the home page: button with "Download App" written under it. */
export function DownloadAppCard() {
  const inApp = useIsNativeApp();
  const info = useAppInfo();
  if (inApp) return null;
  return (
    <section className="mt-12 overflow-hidden rounded-3xl bg-[#0b1220] p-6 text-white shadow-lift sm:p-9">
      <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-teal-300 uppercase"><Smartphone className="size-3.5" /> Android app</span>
          <h2 className="mb-2 font-display text-2xl font-extrabold sm:text-3xl">Study on your phone</h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Install the Novix Academy app on your Android phone — notes, video lectures and MCQ tests, all in one tap. Sign in with the same account.
          </p>
          <ol className="mt-4 space-y-1 text-[13px] text-slate-400">
            <li>1. Tap the button and download the app.</li>
            <li>2. Open the downloaded file. If asked, allow “Install unknown apps” for your browser.</li>
            <li>3. Tap Install, then open Novix Academy.</li>
          </ol>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <a href={APK_URL} download="Novix-Academy.apk" className="group grid size-28 place-items-center rounded-[28px] bg-gradient-to-br from-[#3ddc84] to-[#1aa75b] shadow-[0_20px_40px_-12px_rgba(61,220,132,0.55)] transition hover:-translate-y-0.5" aria-label="Download App">
            <span className="relative">
              <AndroidIcon className="size-14 text-white" />
              <span className="absolute -right-2 -bottom-2 grid size-7 place-items-center rounded-full bg-white text-[#1aa75b] shadow transition group-hover:translate-y-0.5"><Download className="size-4" strokeWidth={2.6} /></span>
            </span>
          </a>
          <a href={APK_URL} download="Novix-Academy.apk" className="font-display text-lg font-extrabold hover:underline">Download App</a>
          <span className="text-xs text-slate-400">For Android{info ? ` · v${info.version} · ${fmtSize(info.sizeBytes)}` : ''}</span>
        </div>
      </div>
    </section>
  );
}
