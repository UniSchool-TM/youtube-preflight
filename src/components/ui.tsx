"use client";

import type { ReactNode } from "react";
import type { ChecklistStatus, Severity } from "@/types";

/* ------------------------------------------------------------------ */
/* Helps                                                               */
/* ------------------------------------------------------------------ */

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  padded = true,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  ariaLabel?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "rounded-[20px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,0,0,0.12)]",
        padded && "p-4 sm:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

function severityIcon(sev: Severity): { symbol: string; label: string } {
  switch (sev) {
    case "good": return { symbol: "✓", label: "良好" };
    case "warning": return { symbol: "!", label: "注意" };
    case "critical": return { symbol: "✕", label: "要改善" };
    case "info": return { symbol: "i", label: "情報" };
  }
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { symbol, label } = severityIcon(severity);
  const styles: Record<Severity, string> = {
    good: "bg-good/10 text-good border-good/40",
    warning: "bg-warn/10 text-warn border-warn/40",
    critical: "bg-crit/10 text-crit border-crit/40",
    info: "bg-info/10 text-info border-info/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        styles[severity]
      )}
      role="status"
      aria-label={`状態: ${label}`}
    >
      <span aria-hidden="true" className="text-sm leading-none">{symbol}</span>
      {label}
    </span>
  );
}

export function ChecklistBadge({ status }: { status: ChecklistStatus }) {
  const map: Record<ChecklistStatus, { symbol: string; label: string; cls: string }> = {
    pass: { symbol: "✓", label: "OK", cls: "bg-good/10 text-good border-good/40" },
    critical: { symbol: "✕", label: "NG", cls: "bg-crit/10 text-crit border-crit/40" },
    warning: { symbol: "!", label: "!", cls: "bg-warn/10 text-warn border-warn/40" },
    info: { symbol: "i", label: "i", cls: "bg-info/10 text-info border-info/40" },
    unset: { symbol: "–", label: "–", cls: "bg-muted/10 text-muted border-border" },
  };
  const m = map[status];
  return (
    <span
      className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-xs font-bold", m.cls)}
      role="status"
      aria-label={m.label}
    >
      <span aria-hidden="true">{m.symbol}</span>
      <span className="sr-only">{m.label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  max,
  colorClass,
  className,
}: {
  value: number;
  max: number;
  colorClass?: string;
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-border", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`達成度 ${Math.round(pct)}%`}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass ?? "bg-accent")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function severityColorClass(severity: Severity): string {
  switch (severity) {
    case "good": return "bg-good";
    case "warning": return "bg-warn";
    case "critical": return "bg-crit";
    case "info": return "bg-info";
  }
}

/* ------------------------------------------------------------------ */
/* Heading                                                             */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="heading-mark text-lg font-bold text-foreground">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-[0_2px_0_rgba(0,0,0,0.2),0_8px_16px_-6px_var(--accent)] hover:brightness-110 active:translate-y-px active:shadow-[0_1px_0_rgba(0,0,0,0.2)]",
  secondary:
    "bg-card text-foreground border border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-accent hover:text-accent",
  danger: "bg-crit/10 text-crit border border-crit/40 hover:bg-crit/20",
  ghost: "text-muted hover:text-foreground hover:bg-border/50",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-full",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        buttonSizes[size],
        buttonStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between gap-4 py-1">
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{label}</span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-crit">*</span>}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring transition-shadow sm:text-sm";

export function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      className="rounded-lg border border-crit/40 bg-crit/10 px-3 py-2 text-sm text-crit"
      role="alert"
    >
      {message}
    </p>
  );
}