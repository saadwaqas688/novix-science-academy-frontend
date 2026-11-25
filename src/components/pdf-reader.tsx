'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Highlighter, ListOrdered, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { api, errMsg } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/* ---------- types & colours ---------- */

type Rect = { x: number; y: number; w: number; h: number };
export type Highlight = { id: number; fileUrl: string; page: number; rects: Rect[]; text: string; color: Color; createdAt: string };
type Color = 'yellow' | 'green' | 'blue' | 'pink';

const COLORS: { key: Color; fill: string; dot: string; label: string }[] = [
  { key: 'yellow', fill: 'rgba(250, 204, 21, 0.42)', dot: '#facc15', label: 'Yellow' },
  { key: 'green', fill: 'rgba(74, 222, 128, 0.42)', dot: '#4ade80', label: 'Green' },
  { key: 'blue', fill: 'rgba(96, 165, 250, 0.42)', dot: '#60a5fa', label: 'Blue' },
  { key: 'pink', fill: 'rgba(244, 114, 182, 0.42)', dot: '#f472b6', label: 'Pink' },
];
const fillOf = (c: Color) => (COLORS.find((x) => x.key === c) ?? COLORS[0]).fill;

/* ---------- pdf.js loader (browser only) ---------- */

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((m) => {
      const lib = m as unknown as PdfJs;
      lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      return lib;
    });
  }
  return pdfjsPromise;
}

/* ---------- selection → normalised rects per page ---------- */

type Pending = { page: number; rects: Rect[]; text: string }[];

function selectionToHighlights(root: HTMLElement): Pending | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-page]'));
  const out = new Map<number, Rect[]>();
  for (const r of Array.from(range.getClientRects())) {
    if (r.width < 2 || r.height < 2) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const el = pages.find((p) => { const b = p.getBoundingClientRect(); return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom; });
    if (!el) continue;
    const b = el.getBoundingClientRect();
    const rect = {
      x: clamp((r.left - b.left) / b.width), y: clamp((r.top - b.top) / b.height),
      w: clamp(r.width / b.width), h: clamp(r.height / b.height),
    };
    const n = Number(el.dataset.page);
    const list = out.get(n) ?? [];
    // skip near-duplicate rects (pdf.js sometimes returns nested spans)
    if (!list.some((o) => Math.abs(o.x - rect.x) < 0.002 && Math.abs(o.y - rect.y) < 0.002 && Math.abs(o.w - rect.w) < 0.004)) list.push(rect);
    out.set(n, list);
  }
  if (!out.size) return null;
  const text = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 4900);
  return Array.from(out.entries()).map(([page, rects]) => ({ page, rects: rects.slice(0, 200), text }));
}
const clamp = (v: number) => Math.min(1, Math.max(0, Number(v.toFixed(5))));

/* ---------- main reader ---------- */

export function PdfReader({ fileUrl }: { fileUrl: string }) {
  const qc = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState('');
  const [width, setWidth] = useState(0);
  const [color, setColor] = useState<Color>('yellow');
  const [pending, setPending] = useState<Pending | null>(null);
  const [active, setActive] = useState<{ id: number; x: number; y: number } | null>(null);
  const [showList, setShowList] = useState(false);

  const key = ['highlights', fileUrl];
  const hq = useQuery({ queryKey: key, queryFn: () => api<{ highlights: Highlight[] }>(`/highlights?file=${encodeURIComponent(fileUrl)}`).then((r) => r.highlights) });
  const highlights = hq.data ?? [];

  const add = useMutation({
    mutationFn: async ({ items, c }: { items: Pending; c: Color }) => {
      const saved: Highlight[] = [];
      for (const it of items) saved.push((await api<{ highlight: Highlight }>('/highlights', { json: { fileUrl, ...it, color: c } })).highlight);
      return saved;
    },
    onSuccess: (saved) => qc.setQueryData<Highlight[]>(key, (old = []) => [...old, ...saved]),
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/highlights/${id}`, { method: 'DELETE' }),
    onSuccess: (_r, id) => qc.setQueryData<Highlight[]>(key, (old = []) => old.filter((h) => h.id !== id)),
    onError: (e) => toast.error(errMsg(e)),
  });
  const recolor = useMutation({
    mutationFn: ({ id, c }: { id: number; c: Color }) => api<{ highlight: Highlight }>(`/highlights/${id}`, { method: 'PATCH', json: { color: c } }),
    onSuccess: (r) => qc.setQueryData<Highlight[]>(key, (old = []) => old.map((h) => (h.id === r.highlight.id ? r.highlight : h))),
    onError: (e) => toast.error(errMsg(e)),
  });

  // load the document
  useEffect(() => {
    let cancelled = false; let loaded: PDFDocumentProxy | null = null;
    setDoc(null); setLoadError('');
    loadPdfJs()
      .then((lib) => lib.getDocument({ url: fileUrl }).promise)
      .then((d) => { loaded = d; if (!cancelled) setDoc(d); else d.destroy(); })
      .catch((e) => { if (!cancelled) setLoadError(errMsg(e)); });
    return () => { cancelled = true; loaded?.destroy(); };
  }, [fileUrl]);

  // follow the container width (re-render pages on resize)
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(([e]) => { clearTimeout(t); t = setTimeout(() => setWidth(Math.floor(e.contentRect.width)), 120); });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  // watch text selection to offer the highlight bar
  useEffect(() => {
    const onSel = () => { if (rootRef.current) setPending(selectionToHighlights(rootRef.current)); };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  const save = useCallback((c: Color) => {
    const items = pending ?? (rootRef.current ? selectionToHighlights(rootRef.current) : null);
    if (!items) return;
    setColor(c);
    add.mutate({ items, c }, { onSuccess: () => { window.getSelection()?.removeAllRanges(); setPending(null); } });
  }, [pending, add]);

  // tap on an existing highlight → small menu
  const onPageClick = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const b = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    const hit = [...highlights].reverse().find((h) => h.page === page && h.rects.some((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h));
    setActive(hit ? { id: hit.id, x: e.clientX, y: e.clientY } : null);
  };

  const goTo = (page: number) => {
    rootRef.current?.querySelector(`[data-page="${page}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowList(false);
  };

  const activeH = active ? highlights.find((h) => h.id === active.id) : null;

  return (
    <div className="relative">
      {/* toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur-xl sm:top-[68px] sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <Highlighter className="size-4 text-muted-foreground" />
        <span className="hidden text-[13px] text-muted-foreground sm:inline">Select text, then pick a colour</span>
        <div className="ml-1 flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button key={c.key} type="button" aria-label={c.label} title={c.label} onClick={() => setColor(c.key)}
              className={cn('size-6 rounded-full border-2 transition', color === c.key ? 'scale-110 border-foreground' : 'border-transparent')} style={{ background: c.dot }} />
          ))}
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setShowList((v) => !v)}>
          <ListOrdered /> My highlights <span className="rounded-full bg-secondary px-1.5 text-[11px]">{highlights.length}</span>
        </Button>
      </div>

      {showList && (
        <div className="glass mb-4 max-h-80 overflow-y-auto rounded-2xl border border-border p-3 shadow-soft">
          {highlights.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No highlights yet. Select any text in the notes and choose a colour.</p> : (
            <ul className="space-y-1.5">
              {highlights.map((h) => (
                <li key={h.id} className="flex items-start gap-2 rounded-xl p-2 hover:bg-secondary">
                  <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: COLORS.find((c) => c.key === h.color)?.dot }} />
                  <button type="button" className="min-w-0 flex-1 text-left text-[13.5px]" onClick={() => goTo(h.page)}>
                    <span className="font-semibold text-muted-foreground">Page {h.page} · </span>{h.text || 'Highlight'}
                  </button>
                  <button type="button" aria-label="Delete highlight" className="text-muted-foreground hover:text-red-600" onClick={() => remove.mutate(h.id)}><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={rootRef} className="mx-auto max-w-[900px] space-y-4">
        {loadError && <p className="rounded-2xl border border-border p-6 text-center text-sm text-red-600">Could not open the notes: {loadError}</p>}
        {!doc && !loadError && <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>}
        {doc && width > 0 && Array.from({ length: doc.numPages }, (_, i) => (
          <PdfPage key={i + 1} doc={doc} pageNumber={i + 1} width={width} highlights={highlights.filter((h) => h.page === i + 1)} onClick={onPageClick} />
        ))}
      </div>

      {/* floating bar while text is selected */}
      {pending && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-8">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-lift">
            <Highlighter className="size-4" />
            <span className="text-[13px] font-semibold">Highlight</span>
            {COLORS.map((c) => (
              <button key={c.key} type="button" aria-label={`Highlight ${c.label}`}
                onPointerDown={(e) => { e.preventDefault(); save(c.key); }}
                className="size-8 rounded-full border-2 border-white shadow" style={{ background: c.dot }} />
            ))}
            {add.isPending && <Loader2 className="size-4 animate-spin" />}
            <button type="button" aria-label="Cancel" className="ml-1 text-muted-foreground" onPointerDown={(e) => { e.preventDefault(); window.getSelection()?.removeAllRanges(); setPending(null); }}><X className="size-4" /></button>
          </div>
        </div>
      )}

      {/* menu for a tapped highlight */}
      {active && activeH && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setActive(null)} />
          <div className="fixed z-50 flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 shadow-lift"
            style={{ left: Math.max(8, Math.min(active.x - 100, (typeof window !== 'undefined' ? window.innerWidth : 400) - 216)), top: Math.max(8, active.y - 56) }}>
            {COLORS.map((c) => (
              <button key={c.key} type="button" aria-label={c.label} onClick={() => { recolor.mutate({ id: activeH.id, c: c.key }); setActive(null); }}
                className={cn('size-7 rounded-full border-2', activeH.color === c.key ? 'border-foreground' : 'border-white')} style={{ background: c.dot }} />
            ))}
            <button type="button" aria-label="Remove highlight" className="ml-1 grid size-7 place-items-center rounded-full text-red-600 hover:bg-red-50" onClick={() => { remove.mutate(activeH.id); setActive(null); }}><Trash2 className="size-4" /></button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- one page: canvas + text layer + highlight overlay ---------- */

function PdfPage({ doc, pageNumber, width, highlights, onClick }: {
  doc: PDFDocumentProxy; pageNumber: number; width: number; highlights: Highlight[];
  onClick: (e: React.MouseEvent<HTMLDivElement>, page: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number; scale: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    let textLayer: { cancel: () => void } | null = null;
    (async () => {
      const lib = await loadPdfJs();
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const viewport = page.getViewport({ scale });
      setSize({ w: viewport.width, h: viewport.height, scale });
      const canvas = canvasRef.current; const text = textRef.current;
      if (!canvas || !text) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const rt = page.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      task = rt;
      await rt.promise.catch(() => undefined);
      if (cancelled) return;
      text.replaceChildren();
      text.style.setProperty('--scale-factor', String(scale));
      const tl = new lib.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport });
      textLayer = tl;
      await tl.render().catch(() => undefined);
    })().catch(() => undefined);
    return () => { cancelled = true; task?.cancel(); textLayer?.cancel(); };
  }, [doc, pageNumber, width]);

  return (
    <div data-page={pageNumber} onClick={(e) => onClick(e, pageNumber)}
      className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-soft"
      style={{ width: size?.w ?? width, height: size?.h ?? width * 1.414 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
        {highlights.flatMap((h) => h.rects.map((r, i) => (
          <div key={`${h.id}-${i}`} className="absolute rounded-[2px]"
            style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, background: fillOf(h.color) }} />
        )))}
      </div>
      <div ref={textRef} className="textLayer" />
      <span className="pointer-events-none absolute right-2 bottom-1.5 text-[10.5px] text-slate-400">{pageNumber}</span>
    </div>
  );
}
