import manifest from './notes-manifest.json';

/** Notes PDFs shipped with the frontend (public/notes/class-<n>/<subject>/ch-<n>.pdf). */
export function staticNotes(subjectSlug: string, classLevel: string, chapterNumber: number) {
  const hit = (manifest as Record<string, { url: string; sizeBytes: number }>)[`${classLevel}/${subjectSlug}/${chapterNumber}`];
  if (!hit) return null;
  return { fileUrl: hit.url, fileName: `${subjectSlug}-class${classLevel}-chapter${chapterNumber}-notes.pdf`, sizeBytes: hit.sizeBytes };
}
