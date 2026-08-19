import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        That page isn’t on the syllabus.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The link may be outdated, or the page moved. Head back home and try again.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Back to home <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </section>
  )
}
