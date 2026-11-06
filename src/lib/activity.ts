'use client';

import { useEffect } from 'react';
import { api } from './api';

/**
 * Time-on-app tracking. While a student has the app open on screen and was active in the
 * last 5 minutes, a heartbeat is sent every minute; the server adds the time to the session.
 */
const BEAT_MS = 60_000;
const IDLE_MS = 5 * 60_000;
let lastActive = Date.now();

/** Count the student as active (e.g. while a lecture is playing inside the video iframe). */
export const markActive = () => { lastActive = Date.now(); };

const device = () => (typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop');

export function useActivityHeartbeat(userId: number | null) {
  useEffect(() => {
    if (!userId) return;
    let lastBeat = 0;
    const beat = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastActive > IDLE_MS) return;
      if (Date.now() - lastBeat < BEAT_MS / 2) return;
      lastBeat = Date.now();
      api('/me/heartbeat', { json: { device: device() } }).catch(() => undefined);
    };
    const onInput = () => { markActive(); };
    const onVisible = () => { if (document.visibilityState === 'visible') { markActive(); beat(); } };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    markActive();
    beat();
    const t = window.setInterval(beat, BEAT_MS);
    return () => {
      window.clearInterval(t);
      events.forEach((e) => window.removeEventListener(e, onInput));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);
}
