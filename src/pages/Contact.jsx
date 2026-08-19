import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import { site, courses } from '../data/site.js'

const empty = { name: '', email: '', phone: '', course: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const update = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((err) => ({ ...err, [name]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!form.email.trim()) next.email = 'Please enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'That email looks incomplete.'
    if (form.phone && !/^[\d\s+()-]{7,}$/.test(form.phone)) next.phone = 'That phone number looks off.'
    if (form.message.trim().length < 10) next.message = 'Tell us a little more (10+ characters).'
    return next
  }

  const submit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    // Demo only — wire this to your backend or a form service.
    console.log('Enquiry submitted:', form)
    setSent(true)
    setForm(empty)
  }

  const details = [
    { icon: 'pin', label: 'Campus', value: site.address },
    { icon: 'phone', label: 'Phone', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}` },
    { icon: 'mail', label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { icon: 'clock', label: 'Office hours', value: site.hours },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Ask us anything — or just come see the place."
        subtitle="Fill in the form and we usually reply within one working day. For admissions during peak season, calling is faster."
      />

      <section className="container-x grid gap-10 py-16 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-extrabold tracking-tight">Send an enquiry</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked with <span className="text-rose-500">*</span> are required.
            </p>

            {sent && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                <div>
                  <p className="text-sm font-bold text-accent-600">Thanks — your enquiry is in.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Someone from the admissions desk will get back to you within one working day.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={submit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                name="name"
                required
                value={form.name}
                onChange={update}
                error={errors.name}
                placeholder="Waqas Ahmed"
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={update}
                error={errors.email}
                placeholder="you@example.com"
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={update}
                error={errors.phone}
                placeholder="+92 300 1234567"
              />

              <div>
                <label htmlFor="course" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Course of interest
                </label>
                <select id="course" name="course" value={form.course} onChange={update} className="field">
                  <option value="">Not sure yet</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={update}
                  placeholder="Tell us the student's grade, subjects and preferred timings…"
                  className="field resize-y"
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Send enquiry <Icon name="arrow" className="h-4 w-4" />
                </button>
                <p className="mt-3 text-xs text-slate-400">
                  Demo form — submissions are logged to the browser console, not sent anywhere.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold tracking-tight">Visit or call</h2>
            <ul className="mt-6 space-y-5">
              {details.map((d) => (
                <li key={d.label} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <Icon name={d.icon} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm font-medium text-slate-700 hover:text-brand-700">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-accent-400/20">
              <div className="text-center">
                <Icon name="pin" className="mx-auto h-8 w-8 text-brand-600" />
                <p className="mt-2 text-sm font-bold text-slate-700">{site.short} Main Campus</p>
                <p className="text-xs text-slate-500">Drop a map embed here</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Field({ label, name, error, required, type = 'text', ...rest }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="field"
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
