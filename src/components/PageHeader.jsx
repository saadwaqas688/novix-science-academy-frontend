export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="container-x py-14 sm:py-20">
        {eyebrow && <p className="eyebrow animate-fadeUp">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl animate-fadeUp text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl animate-fadeUp text-base leading-relaxed text-slate-600 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
