import manifest from './quiz-manifest.json';

export interface QuizQuestion { q: string; options: string[]; answer: number; explanation?: string }
export interface Quiz { id: string; topic: string; slos?: string[]; questions: QuizQuestion[] }
export interface ChapterQuizFile { subject: string; classLevel: string; chapter: number; chapterTitle: string; quizzes: Quiz[] }
export interface QuizMeta { id: string; topic: string; count: number }

type Manifest = Record<string, { url: string; chapterTitle: string; quizzes: QuizMeta[] }>;
const M = manifest as Manifest;

/** Quizzes shipped with the frontend for one chapter (metadata only). */
export const chapterQuizzes = (subject: string, classLevel: string, chapter: number): QuizMeta[] => M[`${classLevel}/${subject}/${chapter}`]?.quizzes ?? [];
export const quizKey = (classLevel: string, subject: string, chapter: number, id: string) => `${classLevel}/${subject}/${chapter}/${id}`;
export const quizHref = (key: string) => `/quiz/${key}`;

export async function loadChapterQuizFile(subject: string, classLevel: string, chapter: number): Promise<ChapterQuizFile> {
  const entry = M[`${classLevel}/${subject}/${chapter}`];
  if (!entry) throw new Error('Quiz not found');
  const res = await fetch(entry.url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Could not load the quiz');
  return res.json();
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
