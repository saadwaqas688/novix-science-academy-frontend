'use client';

import { useEffect, useState } from 'react';

/** Where the website serves the Android app (built by .github/workflows/android-apk.yml). */
export const APK_URL = '/downloads/novix-academy.apk';
export const APK_INFO_URL = '/downloads/app-version.json';

/** True inside the Novix Android app (its WebView adds "NovixApp" to the user agent). */
export const isNativeApp = () => typeof navigator !== 'undefined' && /NovixApp/i.test(navigator.userAgent);

export function useIsNativeApp() {
  const [v, setV] = useState(false);
  useEffect(() => { setV(isNativeApp()); }, []);
  return v;
}

type BrowserPlugin = { open: (o: { url: string }) => Promise<void> };

/**
 * Inside the Android app, PDFs and other files cannot open in the app's web view, so they are
 * handed to the phone's browser (which shows or downloads them). On the website nothing changes.
 */
export function openOutside(e: React.MouseEvent, url: string) {
  if (!isNativeApp()) return;
  e.preventDefault();
  const abs = new URL(url, window.location.href).href;
  const browser = (window as unknown as { Capacitor?: { Plugins?: { Browser?: BrowserPlugin } } }).Capacitor?.Plugins?.Browser;
  if (browser) browser.open({ url: abs }).catch(() => window.open(abs, '_blank'));
  else window.open(abs, '_blank');
}
