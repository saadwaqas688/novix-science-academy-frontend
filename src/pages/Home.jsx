import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import CourseCard from '../components/CourseCard.jsx'
import { stats, features, courses, testimonials, site } from '../data/site.js'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-floaty rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex animate-fadeUp items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              <Icon name="spark" className="h-3.5 w-3.5" />
              Admissions open for the 2026–27 session
            </span>

            <h1 className="mt-5 animate-fadeUp text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Science, taught until it{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                actually clicks
              </span>
              .
            </h1>

            <p className="mt-5 max-w-xl animate-fadeUp text-lg leading-relaxed text-slate-600">
              {site.name} runs small, lab-first batches in physics, chemistry, biology and
              mathematics — for students who want to understand the subject, not just pass it.
            </p>

            <div className="mt-8 flex animate-fadeUp flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">
                Book a free trial class <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link to="/courses" className="btn-ghost">
                Browse courses
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-2xl font-extrabold text-brand-700">{s.value}</dt>
                  <dd className="mt-1 text-xs font-medium text-slate-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-900/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">This week at Novix</p>
                <span className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-600">
                  Live
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  { d: 'Mon', t: 'Physics — Projectile motion lab', c: 'bg-brand-500' },
                  { d: 'Tue', t: 'Chemistry — Titration practical', c: 'bg-accent-500' },
                  { d: 'Thu', t: 'Biology — Microscopy session', c: 'bg-emerald-500' },
                  { d: 'Sat', t: 'Olympiad club — Problem set 14', c: 'bg-purple-500' },
                ].map((r) => (
                  <li
                    key={r.d}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${r.c}`} />
                    <span className="w-9 text-xs font-bold text-slate-400">{r.d}</span>
                    <span className="text-sm text-slate-700">{r.t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-ink p-4 text-white">
                <p className="text-xs text-slate-300">Average batch size</p>
                <p className="mt-1 text-2xl font-extrabold">14 students</p>
                <p className="mt-1 text-xs text-slate-400">Capped at 18, always.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-x py-20">
        <SectionHeading
          center
          eyebrow="Why Novix"
          title="A teaching model built for retention"
          subtitle="Four things we do differently, and have done since 2014."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={f.icon} />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular courses */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Programmes"
              title="Popular courses"
              subtitle="Full syllabus coverage, weekly assessments and past-paper drills in every track."
            />
            <Link to="/courses" className="btn-ghost">
              View all courses <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x py-20">
        <SectionHeading
          center
          eyebrow="Testimonials"
          title="What families tell us"
          subtitle="A few notes from parents and alumni."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="card">
              <Icon name="quote" className="h-6 w-6 text-brand-300" />
              <blockquote className="mt-4 text-sm leading-relaxed text-slate-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-center text-white sm:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Sit in on a class before you decide.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Every new student gets one free trial session in the subject of their choice — no fee,
              no commitment.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="btn bg-white text-ink hover:bg-slate-100">
                Book a trial class
              </Link>
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="btn border border-white/25 text-white hover:bg-white/10">
                <Icon name="phone" className="h-4 w-4" /> {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
