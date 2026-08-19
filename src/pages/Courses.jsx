import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import CourseCard from '../components/CourseCard.jsx'
import Icon from '../components/Icon.jsx'
import { courses } from '../data/site.js'

const filters = ['All', 'Grades 9–12', 'Post Grade 12', 'Grades 8–12']

export default function Courses() {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    return courses.filter((c) => {
      const matchesLevel = active === 'All' || c.level === active
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.blurb.toLowerCase().includes(q) ||
        c.topics.some((t) => t.toLowerCase().includes(q))
      return matchesLevel && matchesQuery
    })
  }, [active, query])

  return (
    <>
      <PageHeader
        eyebrow="Courses"
        title="Programmes for every stage of the science track."
        subtitle="Six programmes, one standard: full syllabus coverage, weekly assessments, and a teacher who knows your child's name."
      />

      <section className="container-x py-14">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  active === f
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>

          <label className="relative sm:w-72">
            <span className="sr-only">Search courses</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a subject or topic…"
              className="field pl-10"
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </label>
        </div>

        {/* Grid */}
        {visible.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">No courses match that search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setActive('All')
              }}
              className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Admissions strip */}
      <section className="bg-slate-50 py-16">
        <div className="container-x grid gap-8 md:grid-cols-3">
          {[
            { icon: 'book', t: '1. Apply', d: 'Send the enquiry form or call us. Takes about two minutes.' },
            { icon: 'users', t: '2. Trial class', d: 'Sit in on a real session in your chosen subject, free of charge.' },
            { icon: 'check', t: '3. Enrol', d: 'Pick a batch timing, complete the paperwork, and start the same week.' },
          ].map((s) => (
            <div key={s.t} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon name={s.icon} />
              </div>
              <div>
                <h3 className="text-base font-bold">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="container-x mt-10">
          <Link to="/contact" className="btn-primary">
            Start an application <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
