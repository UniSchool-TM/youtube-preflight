"use client";

import { useState } from "react";
import { cn, inputClass } from "@/components/ui";

export function ThumbnailUploader({
  file,
  previewUrl,
  onSelect,
  onRemove,
  analyzeState,
}: {
  file: File | null;
  previewUrl: string | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
  analyzeState: "idle" | "analyzing" | "done" | "error";
}) {
  const [dragOver, setDragOver] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setInputError("画像ファイルを選択してください（PNG / JPEG / WebP など）");
      return;
    }
    if (f.size === 0) {
      setInputError("空のファイルです");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setInputError("ファイルサイズが大きすぎます（50MB以下）");
      return;
    }
    setInputError(null);
    onSelect(f);
  };

  return (
    <div>
      {!file ? (
        <label
          className={cn(
            "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/60 hover:bg-border/30"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" className="text-muted" />
            <circle cx="9" cy="9.5" r="1.6" fill="currentColor" className="text-muted" />
            <path d="M6 17l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="1.6" className="text-muted" />
          </svg>
          <span className="text-sm font-semibold text-foreground">
            サムネイル画像をドラッグ＆ドロップ または クリックで選択
          </span>
          <span className="text-xs text-muted">PNG / JPEG / WebP / AVIF / GIF（推奨: 1280×720 以上）</span>
          {inputError && <span className="text-sm text-crit" role="alert">{inputError}</span>}
        </label>
      ) : (
        <div className="rounded-xl border border-border p-3">
          <div className="relative overflow-hidden rounded-lg bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl ?? ""} alt="アップロードしたサムネイルのプレビュー" className="mx-auto max-h-80 w-auto" />
            {analyzeState === "analyzing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  解析中…
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted">
                {(file.size / 1024).toFixed(0)} KB ／ {file.type || "不明"}
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-crit hover:text-crit"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Simulator                                                           */
/* ------------------------------------------------------------------ */

export type GuideKey = "ratio16x9" | "center" | "thirds" | "safe" | "margin";

const GUIDE_LABELS: { key: GuideKey; label: string }[] = [
  { key: "ratio16x9", label: "16:9ガイド" },
  { key: "center", label: "中央線" },
  { key: "thirds", label: "3分割グリッド" },
  { key: "safe", label: "セーフエリア" },
  { key: "margin", label: "余白ガイド" },
];

export function ThumbnailSimulator({ previewUrl }: { previewUrl: string | null }) {
  const [guides, setGuides] = useState<Record<GuideKey, boolean>>({
    ratio16x9: false,
    center: false,
    thirds: false,
    safe: false,
    margin: false,
  });

  if (!previewUrl) return null;

  const scales = [
    { id: "s100", label: "100%", width: "100%" },
    { id: "s75", label: "75%", width: "75%" },
    { id: "s50", label: "50%", width: "50%" },
    { id: "s25", label: "25%", width: "25%" },
  ];
  const cardScale = 0.22;

  const toggle = (key: GuideKey) => setGuides((g) => ({ ...g, [key]: !g[key] }));

  const hasGuide = Object.values(guides).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="サムネイルガイドの表示切り替え">
        {GUIDE_LABELS.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={guides[g.key]}
            onClick={() => toggle(g.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              guides[g.key]
                ? "border-accent bg-accent text-white"
                : "border-border text-muted hover:border-accent hover:text-foreground"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Guides apply to the 100% overlay */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">実寸プレビュー（ガイド表示）</p>
          <div className="relative" style={{ aspectRatio: "16/9", maxWidth: 560 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain bg-black" />
            {guides.ratio16x9 && <div className="pointer-events-none absolute inset-0 guide-16x9" />}
            {guides.center && <div className="pointer-events-none absolute inset-0 guide-center" />}
            {guides.thirds && <div className="pointer-events-none absolute inset-0 guide-thirds" />}
            {guides.safe && <div className="pointer-events-none absolute guide-safe" />}
            {guides.margin && <div className="pointer-events-none absolute guide-margin" />}
            {!hasGuide && (
              <p className="absolute inset-x-0 top-2 text-center text-[11px] text-white/90">
                ガイドをオンにすると注意領域が表示されます
              </p>
            )}
          </div>
        </div>

        {/* Size simulation */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">
            表示サイズシミュレーション（小さくても文字・被写体が見えるか確認）
          </p>
          {scales.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs font-medium text-muted">{s.label}</span>
              <div className="relative flex-1 bg-black" style={{ maxWidth: 560 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={`サムネイル 表示サイズ ${s.label}`} className="w-full" style={{ width: s.width }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-medium text-muted">カード</span>
            <div className="relative bg-black" style={{ width: 180 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="サムネイル カード表示（約22%サイズ）"
                className="w-full"
                style={{ width: `${cardScale * 100}%`, margin: "auto" }}
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            小さい表示サイズ（特に 25% とカード）で文字が潰れていないかを確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}

export { inputClass };