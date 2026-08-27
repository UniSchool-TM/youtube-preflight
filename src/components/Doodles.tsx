import type { ReactNode } from "react";

export function EmptyArt({ variant }: { variant: "clip" | "compare" | "note" }) {
  return (
    <svg
      viewBox="0 0 260 180"
      className="h-36 w-full max-w-[260px] text-muted"
      fill="none"
      aria-hidden="true"
    >
      {variant === "clip" && (
        <g>
          {/* clipboard */}
          <rect x="78" y="36" width="104" height="116" rx="10" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
          <rect x="100" y="26" width="60" height="18" rx="5" fill="var(--accent)" />
          <rect x="118" y="32" width="24" height="6" rx="3" fill="#fff" opacity="0.85" />
          {/* dashed empty lines */}
          <path d="M96 82h68M96 100h68M96 118h68M96 136h42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 7" opacity="0.6" />
          {/* question doodle */}
          <path d="M136 58c-4-4 10-10 1-1M136 64v1" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          {/* sparkle */}
          <path d="M196 52l4 7-7 4 7 4-4 7" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <circle cx="56" cy="120" r="7" stroke="var(--good)" strokeWidth="2" />
          <path d="M53 120l2.5 2.5 4.5-5" stroke="var(--good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {variant === "compare" && (
        <g>
          {/* two thumbnails */}
          <rect x="28" y="44" width="86" height="54" rx="9" fill="#23211d" stroke="currentColor" strokeWidth="2" opacity="0.9" />
          <circle cx="71" cy="66" r="11" fill="#fff" />
          <path d="M67 60v12l8-6z" fill="var(--accent)" />
          <path d="M40 76h40M40 83h26" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <rect x="140" y="52" width="86" height="54" rx="9" fill="#23211d" stroke="currentColor" strokeWidth="2" opacity="0.85" />
          <circle cx="183" cy="74" r="11" fill="#fff" />
          <path d="M179 68v12l8-6z" fill="var(--good)" />
          <path d="M152 84h40M152 91h26" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          {/* between arrows */}
          <path d="M126 70h-6M120 66l-5 5 5 5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M158 76h6M164 72l5 5-5 5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* ground line */}
          <path d="M40 148c40-6 140-6 180-2" stroke="currentColor" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
      {variant === "note" && (
        <g>
          {/* paper sheet */}
          <rect x="84" y="34" width="96" height="112" rx="8" fill="var(--card)" stroke="currentColor" strokeWidth="2" transform="rotate(-2 132 90)" />
          <path d="M100 58h60M100 74h60M100 90h60M100 106h60M100 122h34" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 6" opacity="0.6" transform="rotate(-2 132 90)" />
          {/* folded corner */}
          <path d="M176 40l-8 8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          {/* magnifier */}
          <circle cx="196" cy="128" r="18" stroke="var(--accent)" strokeWidth="3" />
          <path d="M209 141l14 14" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M188 122l7 6M190 130l8 3" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          {/* star */}
          <path d="M60 92l4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1z" stroke="var(--warn)" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({
  art,
  title,
  description,
  action,
}: {
  art: "clip" | "compare" | "note";
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-[20px] border border-border bg-card px-6 py-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,0,0,0.12)]">
      <EmptyArt variant={art} />
      <p className="mt-2 font-bold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}