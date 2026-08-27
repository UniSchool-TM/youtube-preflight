"use client";

import { useMemo } from "react";
import { parseDuration } from "@/lib/duration";
import { cn, Field } from "@/components/ui";

export function DurationInput({
  value,
  onChange,
  onParsed,
}: {
  value: string;
  onChange: (v: string) => void;
  onParsed?: (seconds: number | null, valid: boolean) => void;
}) {
  const parsed = useMemo(() => parseDuration(value), [value]);
  const valid = value.trim() === "" ? null : parsed.valid;
  const label = parsed.valid && parsed.seconds !== null ? secondsLabel(parsed.seconds) : null;

  const handleChange = (v: string) => {
    onChange(v);
    const p = parseDuration(v);
    onParsed?.(p.seconds, p.valid);
  };

  return (
    <Field
      htmlFor="duration"
      label="動画尺"
      hint="MM:SS または HH:MM:SS（例: 7:30 / 1:02:30）"
    >
      <input
        id="duration"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="例: 7:30"
        aria-invalid={valid === false}
        className={cn(
          "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none",
          valid === false
            ? "border-crit focus:border-crit"
            : valid === true
              ? "border-good focus:border-good"
              : "border-border focus:border-accent"
        )}
      />
      {valid === false && (
        <p className="text-xs text-crit" role="alert">
          {parsed.errors[0]}
        </p>
      )}
      {valid === true && label && (
        <p className="text-xs text-good">✓ {label} として認識しました</p>
      )}
      {value.trim() === "" && (
        <p className="text-xs text-muted">チャプターとの整合チェックに使用します（未入力でも診断は可能）</p>
      )}
    </Field>
  );
}

function secondsLabel(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}時間${p(m)}分${p(s)}秒` : m > 0 ? `${m}分${p(s)}秒` : `${s}秒`;
}