'use client';

import { useEffect, useRef, useState } from 'react';
import { markActive } from '@/lib/activity';

/* Minimal typing for the YouTube IFrame API. */
interface YTPlayer { destroy(): void; playVideo(): void; seekTo(s: number, allow: boolean): void }
interface YTNamespace {
  Player: new (el: HTMLElement, o: {
    videoId: string; host?: string; width?: string; height?: string;
    playerVars?: Record<string, string | number>;
    events?: { onStateChange?: (e: { data: number }) => void; onReady?: () => void };
  }) => YTPlayer;
}
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); if (window.YT) resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { apiPromise = null; reject(new Error('YouTube could not be loaded')); };
    document.head.appendChild(s);
    window.setTimeout(() => reject(new Error('YouTube took too long to load')), 12_000);
  });
  return apiPromise;
}

/**
 * In-app YouTube player. Reports when the lecture ends and keeps the student counted as
 * active while the video is playing (clicks inside the iframe do not reach the page).
 */
export function YouTubePlayer({ videoId, title, onEnded, autoplay = true }: { videoId: string; title: string; onEnded?: () => void; autoplay?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let playing = false;
    let cancelled = false;
    const keepAlive = window.setInterval(() => { if (playing) markActive(); }, 30_000);
    setFallback(false);
    loadApi().then((YT) => {
      if (cancelled || !host.current) return;
      const el = document.createElement('div');
      host.current.innerHTML = '';
      host.current.appendChild(el);
      player = new YT.Player(el, {
        videoId, width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: autoplay ? 1 : 0 },
        events: {
          onStateChange: (e) => {
            playing = e.data === 1;
            if (playing) markActive();
            if (e.data === 0) ended.current?.();
          },
        },
      });
    }).catch(() => { if (!cancelled) setFallback(true); });
    return () => { cancelled = true; window.clearInterval(keepAlive); try { player?.destroy(); } catch { /* ignore */ } };
  }, [videoId, autoplay]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-lift [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:size-full">
      {fallback
        ? <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        : <div ref={host} className="absolute inset-0" />}
    </div>
  );
}
