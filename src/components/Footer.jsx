import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { site, courses } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-base font-extrabold tracking-tight">Novix</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
            {site.tagline} A science academy built around small batches, real labs and teachers who
            stay until the concept lands.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li><Link to="/" className="hover:text-brand-700">Home</Link></li>
            <li><Link to="/about" className="hover:text-brand-700">About us</Link></li>
            <li><Link to="/courses" className="hover:text-brand-700">Courses</Link></li>
            <li><Link to="/contact" className="hover:text-brand-700">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Programmes</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            {courses.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link to="/courses" className="hover:text-brand-700">
                  {c.title.split('—')[0].trim()}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{site.address}</li>
            <li className="flex gap-2.5"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{site.phone}</li>
            <li className="flex gap-2.5"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{site.email}</li>
            <li className="flex gap-2.5"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{site.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Demo site — content is illustrative.</p>
        </div>
      </div>
    </footer>
  )
}
