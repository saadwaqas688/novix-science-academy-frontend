import { Atom, Calculator, Cpu, FlaskConical, BookOpen, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { atom: Atom, flask: FlaskConical, sigma: Calculator, cpu: Cpu };

const COVERS: Record<string, string> = {
  physics: 'linear-gradient(145deg,#6366f1 0%,#4338ca 100%)',
  chemistry: 'linear-gradient(145deg,#a855f7 0%,#7c3aed 100%)',
  math: 'linear-gradient(145deg,#14b8a6 0%,#0f766e 100%)',
  computer: 'linear-gradient(145deg,#0ea5e9 0%,#0369a1 100%)',
};

export const subjectIcon = (icon: string): LucideIcon => ICONS[icon] || BookOpen;
export const subjectCover = (slug: string, color = '#0d9488') => COVERS[slug] || `linear-gradient(145deg, ${color}, ${color}cc)`;

export function SubjectIcon({ icon, className }: { icon: string; className?: string }) {
  const I = subjectIcon(icon);
  return <I className={className} strokeWidth={1.8} />;
}
