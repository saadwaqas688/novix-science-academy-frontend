# Novix Science Academy — Frontend

Student app and admin panel for Novix Science Academy (FBISE Physics, Chemistry, Mathematics and Computer Science).

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Query · Recharts

The API lives in a separate repo: [novix-science-academy-backend](https://github.com/saadwaqas688/novix-science-academy-backend).

## Run locally

```bash
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                     # http://localhost:3000
```

Start the backend first (see its README). Admin panel: http://localhost:3000/admin

## Docker

```bash
docker build -t novix-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 .
docker run -p 3000:3000 novix-frontend
```

`NEXT_PUBLIC_API_URL` is baked in at build time — rebuild after changing it.

## What's inside

- **Student app** — home page with the teacher profile, course books per class, chapters with Notes / Videos / Assessments tabs ("Coming soon" when empty), 10-MCQ tests with back/forward navigation, results with answer review, progress page with bar-chart history, profile.
- **Sign-up approval** — new accounts are pending until the admin approves them.
- **Admin panel (`/admin`)** — dashboard, user approvals and management, courses & chapters (book PDF, notes PDF, YouTube links), assessment editor (exactly 10 questions), results, teacher profile.

## Structure

```
src/app/(site)/      student pages (home, courses, chapters, results, progress, profile, login, signup)
src/app/test/[id]    full-screen test page
src/app/admin/       admin panel
src/components/ui/   shadcn/ui components
src/lib/             API client, auth, types
```
