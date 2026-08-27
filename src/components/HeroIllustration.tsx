export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none" aria-hidden="true">
      <div className="tape absolute -top-2 left-6 z-10 h-4 w-20 rotate-[-4deg] rounded-[3px] border border-dashed border-accent/40 bg-accent/15" />
      <svg viewBox="0 0 520 420" className="w-full drop-shadow-[0_24px_40px_-20px_rgba(0,0,0,0.35)]">
        {/* paper sheet */}
        <rect x="34" y="26" width="452" height="372" rx="22" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
        <rect x="60" y="52" width="190" height="26" rx="13" fill="var(--accent-soft)" />
        <rect x="60" y="90" width="120" height="10" rx="5" fill="var(--muted)" opacity="0.4" />
        <rect x="60" y="108" width="150" height="10" rx="5" fill="var(--muted)" opacity="0.3" />

        {/* thumbnail mockup */}
        <g>
          <rect x="60" y="136" width="250" height="141" rx="14" fill="#23211d" />
          <circle cx="148" cy="193" r="34" fill="#fff" />
          <circle cx="148" cy="193" r="34" fill="none" stroke="var(--accent)" strokeWidth="6" opacity="0.25" />
          <path d="M138 177v32l24-16z" fill="var(--accent)" />
          <rect x="76" y="214" width="90" height="9" rx="4.5" fill="#fff" opacity="0.85" />
          <rect x="76" y="230" width="62" height="7" rx="3.5" fill="#fff" opacity="0.5" />
          <rect x="128" y="258" width="90" height="7" rx="3.5" fill="var(--accent)" />
          <circle cx="104" cy="258" r="9" fill="var(--warn)" />
        </g>

        {/* char line + tag */}
        <g>
          <rect x="234" y="92" width="12" height="12" rx="6" fill="var(--good)" />
          <rect x="252" y="92" width="120" height="12" rx="6" fill="var(--muted)" opacity="0.35" />
          <rect x="234" y="112" width="96" height="12" rx="6" fill="var(--muted)" opacity="0.28" />
          <rect x="252" y="46" width="74" height="20" rx="10" fill="var(--accent)" />
          <path d="M267 56h27M277 52v8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* score badge */}
        <g>
          <circle cx="372" cy="196" r="42" fill="var(--card)" stroke="var(--accent)" strokeWidth="3" />
          <path d="M352 196l13 14 27-30" fill="none" stroke="var(--good)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <text x="372" y="228" textAnchor="middle" fontWeight="800" fontSize="20" fill="var(--foreground)" style={{ fontFamily: "var(--yp-font), sans-serif" }}>92</text>
          <text x="372" y="244" textAnchor="middle" fontWeight="700" fontSize="11" fill="var(--muted)" style={{ fontFamily: "var(--yp-font), sans-serif" }}>/ 100</text>
        </g>

        {/* checklist sticky */}
        <g transform="rotate(-4 286 322)">
          <rect x="200" y="252" width="268" height="128" rx="14" fill="#fff4d6" stroke="#e8c46a" strokeWidth="2" />
          <circle cx="224" cy="284" r="11" fill="var(--good)" />
          <path d="M219 284l4 4 7-8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="244" y="278" width="120" height="11" rx="5.5" fill="#8a6d2b" opacity="0.75" />
          <circle cx="224" cy="322" r="11" fill="none" stroke="var(--muted)" strokeWidth="2.2" opacity="0.6" />
          <rect x="244" y="316" width="96" height="11" rx="5.5" fill="#8a6d2b" opacity="0.5" />
          <circle cx="224" cy="360" r="11" fill="none" stroke="var(--muted)" strokeWidth="2.2" opacity="0.6" />
          <rect x="244" y="354" width="60" height="11" rx="5.5" fill="#8a6d2b" opacity="0.35" />
        </g>

        {/* doodles */}
        <path d="M316 64c16-6 34-6 48 2M320 104c18-6 40-4 56 6" fill="none" stroke="var(--muted)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 7" />
        <path d="M486 84l8 8M502 84l-8 8" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <g>
          <circle cx="500" cy="58" r="9" fill="var(--warn)" />
          <path d="M500 51.5v4M500 59.3v.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <path d="M84 300a14 14 0 1 0 3-8" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M92 292l3 3-8 3-3-3z" fill="var(--accent)" opacity="0.7" />
      </svg>
      <span className="absolute -bottom-2 right-8 rotate-2 font-hand text-lg text-accent/90">check before you fly!</span>
    </div>
  );
}