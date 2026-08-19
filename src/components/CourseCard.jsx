import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function CourseCard({ course }) {
  return (
    <article className="card flex flex-col">
      <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${course.color}`} />
      <h3 className="mt-4 text-lg font-bold leading-snug">{course.title}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {course.level} · {course.duration} · {course.schedule}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{course.blurb}</p>

      <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        {course.topics.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Icon name="check" className="h-4 w-4 shrink-0 text-accent-500" />
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-bold text-brand-700">{course.fee}</span>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand-700"
        >
          Enrol <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
