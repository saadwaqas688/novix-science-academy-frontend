export default function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="novixGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3183fb" />
          <stop offset="100%" stopColor="#16b89a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#novixGrad)" />
      <circle cx="24" cy="24" r="4.2" fill="#fff" />
      <g stroke="#fff" strokeWidth="1.9" fill="none" opacity="0.95">
        <ellipse cx="24" cy="24" rx="15" ry="6.6" />
        <ellipse cx="24" cy="24" rx="15" ry="6.6" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="15" ry="6.6" transform="rotate(120 24 24)" />
      </g>
    </svg>
  )
}
