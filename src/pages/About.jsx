import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import Icon from '../components/Icon.jsx'
import { values, milestones, stats, site } from '../data/site.js'

const faculty = [
  { name: 'Dr. Ayesha Malik', role: 'Head of Physics', detail: 'PhD, Applied Physics · 14 years teaching' },
  { name: 'Prof. Kamran Sheikh', role: 'Head of Chemistry', detail: 'MPhil, Organic Chemistry · 11 years' },
  { name: 'Dr. Sana Farooq', role: 'Head of Biology', detail: 'MBBS, MPhil Physiology · 9 years' },
  { name: 'Mr. Bilal Raza', role: 'Head of Mathematics', detail: 'MSc Mathematics · 12 years' },
]

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A small academy that refused to get big quickly."
        subtitle={`${site.name} started in 2014 with two rooms and 31 students. We grew slowly and on purpose — because batch size is the one variable we are not willing to trade away.`}
      />

      {/* Story */}
      <section className="container-x grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Our story"
            title="Built by teachers, not by a franchise"
            subtitle="Novix was founded by four subject teachers who were tired of watching students memorise their way through science."
          />
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              The idea was simple: cap the batch, build the labs first, and let teachers spend the
              time a concept actually needs. It made growth slower and margins thinner, and it is
              also the only reason our results hold up year after year.
            </p>
            <p>
              Today we run five programmes across two campuses, and the rules have not changed. No
              batch goes past eighteen students. Every teacher is observed and coached each term.
              Fifteen percent of every intake studies on a full merit scholarship, funded by us.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-extrabold text-brand-700">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Milestones</h3>
          <ol className="mt-6 space-y-6 border-l border-slate-200 pl-6">
            {milestones.map((m) => (
              <li key={m.year} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-600 ring-4 ring-brand-100" />
                <p className="text-sm font-extrabold text-brand-700">{m.year}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <SectionHeading
            center
            eyebrow="What we believe"
            title="Three commitments we hold ourselves to"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <div key={v.title} className="card">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty */}
      <section className="container-x py-20">
        <SectionHeading
          center
          eyebrow="Faculty"
          title="The people in the room"
          subtitle="Department heads who teach, not just administrate."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {faculty.map((f) => (
            <div key={f.name} className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-extrabold text-white">
                {f.name.split(' ').slice(-2).map((w) => w[0]).join('')}
              </div>
              <h3 className="mt-4 text-base font-bold">{f.name}</h3>
              <p className="text-sm font-semibold text-brand-600">{f.role}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link to="/courses" className="btn-primary">
            See what we teach <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <Link to="/contact" className="btn-ghost">
            Visit the campus
          </Link>
        </div>
      </section>
    </>
  )
}
