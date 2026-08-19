# Novix Science Academy — React website

A small marketing site for a fictional science academy, built with **Vite + React 18 + React Router 6 + Tailwind CSS 3**.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Pages

| Route      | File                     | What's on it |
|------------|--------------------------|--------------|
| `/`        | `src/pages/Home.jsx`     | Hero, stats, "why us" features, popular courses, testimonials, CTA |
| `/about`   | `src/pages/About.jsx`    | Story, milestone timeline, values, faculty cards |
| `/courses` | `src/pages/Courses.jsx`  | Filterable + searchable course grid, admissions steps |
| `/contact` | `src/pages/Contact.jsx`  | Validated enquiry form, contact details, map placeholder |
| `*`        | `src/pages/NotFound.jsx` | 404 |

## Where to edit things

- **All site content** — courses, stats, testimonials, contact details, timeline — lives in `src/data/site.js`. Change it there and every page updates.
- **Brand colours** are in `tailwind.config.js` under `theme.extend.colors` (`brand`, `accent`, `ink`).
- **Reusable classes** (`.btn-primary`, `.card`, `.field`, `.container-x`) are defined in `src/index.css`.

## Notes

- The contact form validates client-side and logs to the console. To make it real, POST `form` in `src/pages/Contact.jsx` to your API or a service like Formspree.
- The map on the Contact page is a styled placeholder — swap in a Google Maps `<iframe>`.
- `public/_redirects` makes client-side routing work on Netlify/Render static hosting. On other hosts, add an equivalent SPA rewrite to `/index.html`.
- All content is illustrative placeholder copy.
