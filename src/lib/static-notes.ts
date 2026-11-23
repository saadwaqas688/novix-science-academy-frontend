import manifest from './notes-manifest.json';
import chapterManifest from './chapter-notes-manifest.json';

export type StaticNote = { fileUrl: string; fileName: string; sizeBytes: number; title: string };

/**
 * Notes PDFs shipped with the frontend:
 *   public/notes/class-<n>/<subject>/ch-<n>.pdf           (whole chapter)
 *   public/notes/class-<n>/<subject>/ch-<n>-ex-<x.y>.pdf  (one exercise)
 */
type Manifest = Record<string, { url: string; sizeBytes: number; part: string; title: string }[]>;

export function staticNotes(subjectSlug: string, classLevel: string, chapterNumber: number, source: Manifest = manifest as Manifest, kind = 'notes'): StaticNote[] {
  const list = (source as Record<string, { url: string; sizeBytes: number; part: string; title: string }[]>)[`${classLevel}/${subjectSlug}/${chapterNumber}`] ?? [];
  return list.map((n) => ({
    fileUrl: n.url,
    fileName: `${subjectSlug}-class${classLevel}-chapter${chapterNumber}${n.part ? `-${n.part}` : ''}-${kind}.pdf`,
    sizeBytes: n.sizeBytes,
    title: n.title,
  }));
}

/** Topic-wise SLO / concept based notes: public/chapter-notes/class-<n>/<subject>/ch-<n>.pdf */
export function staticChapterNotes(subjectSlug: string, classLevel: string, chapterNumber: number): StaticNote[] {
  return staticNotes(subjectSlug, classLevel, chapterNumber, chapterManifest as Manifest, 'chapter-notes');
}
