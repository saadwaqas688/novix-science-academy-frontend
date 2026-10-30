import manifest from './notes-manifest.json';

export type StaticNote = { fileUrl: string; fileName: string; sizeBytes: number; title: string };

/**
 * Notes PDFs shipped with the frontend:
 *   public/notes/class-<n>/<subject>/ch-<n>.pdf           (whole chapter)
 *   public/notes/class-<n>/<subject>/ch-<n>-ex-<x.y>.pdf  (one exercise)
 */
export function staticNotes(subjectSlug: string, classLevel: string, chapterNumber: number): StaticNote[] {
  const list = (manifest as Record<string, { url: string; sizeBytes: number; part: string; title: string }[]>)[`${classLevel}/${subjectSlug}/${chapterNumber}`] ?? [];
  return list.map((n) => ({
    fileUrl: n.url,
    fileName: `${subjectSlug}-class${classLevel}-chapter${chapterNumber}${n.part ? `-${n.part}` : ''}-notes.pdf`,
    sizeBytes: n.sizeBytes,
    title: n.title,
  }));
}
