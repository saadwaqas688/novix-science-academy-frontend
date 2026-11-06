export type ClassLevel = '9' | '10' | '11' | '12';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface User {
  id: number; name: string; email: string; phone: string; classLevel: string;
  role: 'student' | 'admin'; status: UserStatus; createdAt: string;
}

export interface Teacher {
  name: string; title: string; intro: string; highlights: string[];
  years: string; students: string; results: string; photoUrl: string | null;
}

export interface SubjectSummary {
  id: number; slug: string; name: string; color: string; icon: string; chapterCount: number; hasBook?: boolean;
}

export interface Book { id: number; fileUrl: string; fileName: string; sizeBytes: number }
export interface Notes { id?: number; fileUrl: string; fileName: string; sizeBytes: number }
export interface Video { id: number; title: string; youtubeUrl: string; duration: string | null; watched?: boolean }

export interface ChapterSummary {
  id: number; number: number; title: string; hasNotes: boolean; videoCount: number; assessmentCount: number; completedCount: number;
}

export interface SubjectPage {
  subject: SubjectSummary; classLevel: ClassLevel; book: Book | null; chapters: ChapterSummary[]; progress: { done: number; total: number };
}

export interface ChapterPage {
  chapter: { id: number; number: number; title: string; classLevel: ClassLevel; subjectId: number };
  chapterCount: number;
  subject: SubjectSummary;
  notes: Notes | null;
  videos: Video[];
  assessments: { id: number; topic: string; questionCount: number; bestScore: number | null; attemptCount: number }[];
}

export interface AssessmentMeta {
  id: number; topic: string;
  chapter: { id: number; number: number; title: string; classLevel: ClassLevel };
  subject: { slug: string; name: string; color: string; icon: string };
}

export interface ReviewItem { id: number; text: string; options: string[]; correctIndex: number; answer: number | null; correct: boolean }
export interface AttemptResult {
  attempt: { id: number; score: number; total: number; durationSec: number; createdAt: string };
  assessment: AssessmentMeta; review: ReviewItem[];
}

export interface ProgressAttempt {
  id: number; kind: 'test' | 'quiz'; quizKey: string | null; score: number; total: number; durationSec: number; createdAt: string;
  assessmentId: number | null; topic: string; chapterId: number | null; chapterNumber: number; chapterTitle: string; classLevel: string;
  subjectSlug: string; subjectName: string; subjectColor: string; subjectIcon: string;
}
export interface Progress {
  attempts: ProgressAttempt[];
  summary: { count: number; average: number; bestSubject: string | null; questionsAnswered: number };
  bySubject: { slug: string; name: string; color: string; icon: string; count: number; average: number }[];
}

export interface AdminAttempt {
  id: number; kind: 'test' | 'quiz'; quizKey: string | null; score: number; total: number; durationSec: number; createdAt: string;
  userId: number; userName: string; userEmail: string; assessmentId: number; topic: string;
  chapterNumber: number; chapterTitle: string; classLevel: string; subjectSlug: string; subjectName: string; subjectColor: string;
}

export interface AdminChapter {
  id: number; number: number; title: string; notes: Notes | null; videos: Video[]; assessmentCount: number;
}

export interface AdminAssessmentRow {
  id: number; topic: string; published: boolean; createdAt: string; chapterId: number; chapterNumber: number; chapterTitle: string;
  classLevel: string; subjectSlug: string; subjectName: string; subjectColor: string; questionCount: number; attemptCount: number;
}

export interface EditableQuestion { text: string; options: string[]; correctIndex: number | null }

export interface QuizBest { quizKey: string; chapterNumber: number; best: number; total: number; count: number }
export interface QuizResult {
  id: number; quizKey: string; subjectSlug: string; subjectName: string; classLevel: string; chapterNumber: number; chapterTitle: string;
  topic: string; answers: (number | null)[]; score: number; total: number; durationSec: number; createdAt: string;
}

export interface AdminUserRow extends User {
  quizCount: number; averageScore: number | null; activeSec14: number; lastSeenAt: string | null; online: boolean;
}

export interface ActivityResult {
  id: number; kind: 'test' | 'quiz'; key: string; score: number; total: number; durationSec: number; createdAt: string;
  topic: string; chapterNumber: number; chapterTitle: string; classLevel: string; subjectSlug: string; subjectName: string; subjectColor: string;
}
export interface AppSession { id: number; startedAt: string; lastSeenAt: string; activeSec: number; device: string }
export interface UserActivity {
  user: User;
  results: ActivityResult[];
  time: {
    activeSec14: number; activeSecAll: number; activeDays14: number; sessionCount14: number;
    lastSeenAt: string | null; online: boolean; sessions: AppSession[];
  };
  videosWatched: number;
}

export type AttendanceMark = 'present' | 'absent' | 'leave';
export interface AttendanceStudentRow {
  id: number; name: string; groupName: string; present: number; absent: number; leave: number;
  present30: number; marked30: number; lastDate: string | null; recent: AttendanceMark[];
}
export interface AttendanceList {
  students: AttendanceStudentRow[];
  summary: { students: number; firstDate: string | null; latestDate: string | null; days: number; latestDay: Partial<Record<AttendanceMark, number>> };
}
export interface AttendanceStudentDetail {
  student: { id: number; name: string; groupName: string; createdAt: string };
  records: { date: string; status: AttendanceMark }[];
  latestDate: string | null;
}
