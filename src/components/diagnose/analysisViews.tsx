"use client";

import { useState, type ReactNode } from "react";
import type { DominantColor, Reason, Severity } from "@/types";
import { cn, SeverityBadge } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Stat row                                                            */
/* ------------------------------------------------------------------ */

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 py-2 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right">
        <span className="font-semibold tabular-nums text-foreground">{value}</span>
        {note && <span className="ml-1 text-xs text-muted">{note}</span>}
      </dd>
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: ReactNode; note?: string }[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {items.map((it) => (
        <Stat key={it.label} {...it} />
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Reason / message list                                               */
/* ------------------------------------------------------------------ */

export type MessageItem =
  | Reason
  | { label: string; severity: Severity; detail: string };

export function MessageList({ reasons, compact }: { reasons: MessageItem[]; compact?: boolean }) {
  if (reasons.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", compact && "text-sm")}>
      {reasons.map((r, i) => {
        const type: Severity = "type" in r ? r.type : r.severity;
        const text = "text" in r ? r.text : `${r.label}: ${r.detail}`;
        return (
          <li key={i} className="flex items-start gap-2">
            <SeverityBadge severity={type} />
            <span className="text-sm leading-relaxed text-foreground/90">{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Brightness / contrast meter                                         */
/* ------------------------------------------------------------------ */

export function Meter({
  label,
  value,
  min = 0,
  max = 1,
  format,
  status,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  status?: Severity;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = !status
    ? "bg-accent"
    : status === "good"
      ? "bg-good"
      : status === "warning"
        ? "bg-warn"
        : status === "critical"
          ? "bg-crit"
          : "bg-info";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted">{label}</span>
        <span className="tabular-nums text-foreground">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dominant color swatch with click-to-copy                            */
/* ------------------------------------------------------------------ */

export function ColorSwatch({ color, index }: { color: DominantColor; index: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void copy();
        }
      }}
      className="group flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left hover:border-accent"
      aria-label={`色 ${index + 1} ${color.hex} をコピー`}
    >
      <span
        aria-hidden="true"
        className="h-10 w-10 shrink-0 rounded-md ring-1 ring-black/10"
        style={{ backgroundColor: color.hex }}
      />
      <span className="min-w-0">
        <span className="block font-mono text-sm font-semibold text-foreground">{color.hex}</span>
        <span className="block text-xs text-muted">
          RGB {color.rgb[0]},{color.rgb[1]},{color.rgb[2]} ／ HSL {color.hsl[0]}°,{color.hsl[1]}%,{color.hsl[2]}% ／ {(color.ratio * 100).toFixed(0)}%
        </span>
      </span>
      <span className="ml-auto text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
        {copied ? "コピー済み ✓" : "コピー"}
      </span>
      <span className="sr-only">{copied ? "コピーしました" : ""}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Mini bar chart (histogram)                                          */
/* ------------------------------------------------------------------ */

export function BarChart({
  values,
  maxVal,
  labels,
  ariaLabel,
  colorClass = "bg-accent",
  height = 48,
}: {
  values: number[];
  maxVal: number;
  labels?: string[];
  ariaLabel: string;
  colorClass?: string;
  height?: number;
}) {
  const max = maxVal || 1;
  return (
    <div
      className="flex items-end gap-1"
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col justify-end" title={labels?.[i]}>
          <div
            className={cn("rounded-t", colorClass)}
            style={{ height: `${Math.max(2, (v / max) * (height - 4))}px` }}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Token chips for title words                                         */
/* ------------------------------------------------------------------ */

export function TokenFlow({
  tokens,
  className,
}: {
  tokens: { text: string; importance: number }[];
  className?: string;
}) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-1.5 gap-y-1", className)} aria-label="タイトルの語と重要度">
      {tokens.length === 0 && <span className="text-muted">語を検出できませんでした</span>}
      {tokens.map((t, i) => (
        <span key={i} className="group relative inline-block">
          <span
            className={cn(
              "rounded px-0.5",
              t.importance >= 3
                ? "bg-accent/15 text-accent font-semibold"
                : t.importance >= 1
                  ? "bg-border/70 text-foreground"
                  : "text-muted"
            )}
          >
            {t.text}
          </span>
          <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
            重要度 {t.importance}
          </span>
        </span>
      ))}
    </p>
  );
}