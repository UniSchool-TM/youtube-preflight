"use client";

import { useState } from "react";
import Link from "next/link";
import type { ThumbnailAnalysis, TitleAnalysis } from "@/types";
import { Button, Card, Field, SectionHeading, cn, inputClass } from "@/components/ui";
import { Meter } from "@/components/diagnose/analysisViews";
import { EmptyState } from "@/components/Doodles";
import { analyzeThumbnailFile } from "@/lib/imageDecode";
import { analyzeTitle } from "@/lib/title";
import { compareResults } from "@/lib/export";
import { useHistory } from "@/hooks/useHistory";

/* ------------------------------------------------------------------ */
/* Thumbnail compare                                                   */
/* ------------------------------------------------------------------ */

type ThumbEntry = {
  key: string;
  file: File | null;
  url: string | null;
  analysis: ThumbnailAnalysis | null;
  analyzing: boolean;
  error: string | null;
};

const MAX_THUMBS = 5;
const emptyThumb = (key: string): ThumbEntry => ({
  key,
  file: null,
  url: null,
  analysis: null,
  analyzing: false,
  error: null,
});

function nextKey(): string {
  return `t_${Math.random().toString(36).slice(2, 8)}`;
}

function ThumbCompare() {
  const [entries, setEntries] = useState<ThumbEntry[]>(() =>
    Array.from({ length: 2 }, (_, i) => emptyThumb(`init${i}`))
  );

  const analyzed = entries.filter((e): e is ThumbEntry & { analysis: ThumbnailAnalysis } => Boolean(e.analysis));

  const analyze = async (entry: ThumbEntry, file: File) => {
    setEntries((prev) => prev.map((e) => (e.key === entry.key ? { ...e, analyzing: true, error: null } : e)));
    try {
      const { analysis, bitmap } = await analyzeThumbnailFile(file);
      bitmap.close();
      setEntries((prev) =>
        prev.map((e) =>
          e.key === entry.key ? { ...e, analysis, analyzing: false } : e
        )
      );
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) =>
          e.key === entry.key
            ? { ...e, analyzing: false, error: err instanceof Error ? err.message : "解析に失敗しました" }
            : e
        )
      );
    }
  };

  const onFile = (entry: ThumbEntry, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setEntries((prev) =>
      prev.map((e) =>
        e.key === entry.key ? { ...e, file, url, analysis: null, error: null } : e
      )
    );
    void analyze({ ...entry, file, url, analysis: null }, file);
  };

  const addSlot = () => {
    if (entries.length >= MAX_THUMBS) return;
    setEntries((prev) => [...prev, emptyThumb(nextKey())]);
  };

  const remove = (key: string) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.key === key);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((e) => e.key !== key);
    });
  };

  return (
    <Card ariaLabel="サムネイル比較">
      <SectionHeading
        title="サムネイル比較"
        description={`最大 ${MAX_THUMBS} 枚を横並びで比較できます。画像はブラウザ内でのみ処理されます。`}
        right={
          entries.length < MAX_THUMBS ? (
            <Button onClick={addSlot}>＋ 追加（{entries.length}/${MAX_THUMBS}）</Button>
          ) : undefined
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {entries.map((entry) => (
          <div key={entry.key} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            {entry.url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.url} alt="比較対象のサムネイル" className="aspect-video w-full rounded-lg bg-black object-contain" />
                <p className="truncate text-xs text-muted">{entry.file?.name}</p>
              </>
            ) : (
              <label
                className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted hover:border-accent"
              >
                選択
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    onFile(entry, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {entry.analyzing && (
              <p className="animate-pulse text-xs text-accent">解析中…</p>
            )}
            {entry.error && <p className="text-xs text-crit">{entry.error}</p>}
            {entry.analysis && !entry.analyzing && (
              <ul className="space-y-1 text-xs text-foreground">
                <li className="flex justify-between"><span className="text-muted">解像度</span><span>{entry.analysis.width}×{entry.analysis.height}</span></li>
                <li className="flex justify-between"><span className="text-muted">明るさ</span><span>{(entry.analysis.avgBrightness * 100).toFixed(0)}%</span></li>
                <li className="flex justify-between"><span className="text-muted">彩度</span><span>{(entry.analysis.avgSaturation * 100).toFixed(0)}%</span></li>
                <li className="flex justify-between"><span className="text-muted">情報量</span><span>{entry.analysis.edgesPerPixel.toFixed(2)}</span></li>
                <li className="flex justify-between">
                  <span className="text-muted">16:9</span>
                  <span className={Math.abs(entry.analysis.aspectRatio - 16 / 9) <= 0.15 ? "text-good" : "text-warn"}>
                    {Math.abs(entry.analysis.aspectRatio - 16 / 9) <= 0.15 ? "✓" : (entry.analysis.aspectRatio).toFixed(3)}
                  </span>
                </li>
              </ul>
            )}
            <button
              type="button"
              onClick={() => remove(entry.key)}
              className="mt-auto self-end rounded border border-border px-3 py-2 text-xs text-muted hover:border-crit hover:text-crit"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      {analyzed.length >= 2 && <ThumbCompareTable entries={analyzed} />}
    </Card>
  );
}

function ThumbCompareTable({ entries }: { entries: { analysis: ThumbnailAnalysis }[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">サムネイル指標の比較</caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="py-2 pr-3 font-medium">指標</th>
            {entries.map((e, i) => (
              <th key={i} className="px-3 py-2 font-medium">{i + 1}枚目</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-foreground">
          {[
            ["解像度", (a: ThumbnailAnalysis) => `${a.width}×${a.height}`],
            ["アスペクト比", (a: ThumbnailAnalysis) => a.aspectRatio.toFixed(3)],
            ["明るさ", (a: ThumbnailAnalysis) => `${(a.avgBrightness * 100).toFixed(0)}%`],
            ["コントラスト", (a: ThumbnailAnalysis) => a.contrast.toFixed(2)],
            ["彩度", (a: ThumbnailAnalysis) => `${(a.avgSaturation * 100).toFixed(0)}%`],
            ["情報量", (a: ThumbnailAnalysis) => a.edgesPerPixel.toFixed(2)],
          ].map(([label, fn]) => (
            <tr key={label as string} className="border-b border-border/60">
              <td className="py-2 pr-3 text-muted">{label as string}</td>
              {entries.map((e, i) => (
                <td key={i} className="px-3 py-2 tabular-nums">
                  {(fn as (a: ThumbnailAnalysis) => string)(e.analysis)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Title A/B compare                                                   */
/* ------------------------------------------------------------------ */

function titleSummary(t: TitleAnalysis | null): { chars: number; score: number; label: string; cls: string } {
  if (!t) return { chars: 0, score: 0, label: "未入力", cls: "text-muted" };
  const n = t.counts.total;
  const overuse = t.overuseIssues.some((i) => i.severity === "critical" || i.severity === "warning");
  const lenScore = n >= 10 && n <= 80 ? 2 : n > 0 && n <= 100 ? 1 : 0;
  const structScore = overuse ? 0 : t.tokens.some((tk) => tk.importance >= 2) ? 2 : 1;
  const ratioScore = t.frontInfoRatio >= 0.5 ? 1 : 0;
  const score = lenScore + structScore + ratioScore;
  const max = 5;
  const label = `${score}/${max}`;
  const cls = score >= 4 ? "text-good" : score >= 2 ? "text-warn" : "text-crit";
  return { chars: n, score, label, cls };
}

function TitleAbCompare() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const ta = a.trim() ? analyzeTitle(a) : null;
  const tb = b.trim() ? analyzeTitle(b) : null;
  const sa = titleSummary(ta);
  const sb = titleSummary(tb);

  const cells = (t: TitleAnalysis | null, s: { chars: number; label: string; cls: string }): { label: string; value: React.ReactNode }[] => [
    { label: "文字数", value: <span className="tabular-nums">{s.chars}</span> },
    { label: "構造スコア", value: <span className={cn("font-bold tabular-nums", s.cls)}>{s.label}</span> },
    {
      label: "重要語前寄り率",
      value: t ? <span className="tabular-nums">{(t.frontInfoRatio * 100).toFixed(0)}%</span> : <span className="text-muted">—</span>,
    },
    {
      label: "疑問形・感嘆",
      value: t
        ? `${t.structure.isQuestionForm || t.structure.hasExclamationMark ? "あり" : "なし"}`
        : "—",
    },
  ];

  const renderCell = (t: TitleAnalysis | null, s: { chars: number; label: string; cls: string }, key: string) =>
    cells(t, s).map((c) => (
      <div key={key + c.label} className="flex items-baseline justify-between gap-2 border-b border-border/60 py-2 last:border-0">
        <dt className="text-sm text-muted">{c.label}</dt>
        <dd className="text-right text-sm text-foreground">{c.value}</dd>
      </div>
    ));

  return (
    <Card ariaLabel="タイトルA/B比較">
      <SectionHeading
        title="タイトル A/B 比較"
        description="2案を横並びで比較します。文字数・構造・重要語の配置の違いを確認できます。"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="titleA" label="案 A">
          <input id="titleA" className={inputClass} value={a} onChange={(e) => setA(e.target.value)} placeholder="タイトル案Aを入力" />
        </Field>
        <Field htmlFor="titleB" label="案 B">
          <input id="titleB" className={inputClass} value={b} onChange={(e) => setB(e.target.value)} placeholder="タイトル案Bを入力" />
        </Field>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <dl>{renderCell(ta, sa, "A")}</dl>
        <dl>{renderCell(tb, sb, "B")}</dl>
      </div>
      {sa.score > 0 && sb.score > 0 && sa.score !== sb.score && (
        <p className="mt-4 rounded-lg border border-info/40 bg-info/10 px-3 py-2 text-sm text-info" role="status">
          A/B比較は構造の違いを確認するための参考です。どちらが正解というものではありません。
        </p>
      )}
      <Meter label="A/B 比較" value={(sa.score + sb.score) / 10} max={1} format={() => `${sa.label} vs ${sb.label}`} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Diagnosis result compare                                            */
/* ------------------------------------------------------------------ */

function DiagnosisCompare() {
  const { history, loaded } = useHistory();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id]
    );
  };

  const rows = history.filter((h) => selected.includes(h.id));

  const cols = [
    { key: "total", label: "総合" },
    { key: "title", label: "タイトル" },
    { key: "titleThumbnail", label: "タイトル×サムネ" },
    { key: "thumbnail", label: "サムネイル" },
    { key: "description", label: "概要欄" },
    { key: "chapters", label: "チャプター" },
    { key: "hashtags", label: "ハッシュタグ" },
    { key: "technical", label: "技術" },
  ] as const;

  const data = compareResults(rows.map((r) => r.result));

  return (
    <Card ariaLabel="診断結果の比較">
      <SectionHeading
        title="診断結果の比較"
        description="履歴から最大5件の診断結果を選んで比較します。"
      />
      {!loaded ? (
        <p className="text-sm text-muted">履歴を読み込み中…</p>
      ) : history.length === 0 ? (
        <EmptyState
          art="note"
          title="まだ比較できる履歴がありません。"
          description="まず診断を行い、結果を保存するとここから選んで比較できるようになります。"
          action={
            <Link href="/diagnose">
              <Button variant="primary" size="lg">診断を始める</Button>
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">比較する履歴を選択（{selected.length}/5）:</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => toggle(h.id)}
                  aria-pressed={selected.includes(h.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                    selected.includes(h.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/60"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{h.title}</span>
                    <span className="block text-xs text-muted">
                      {new Date(h.createdAt).toLocaleString("ja-JP")}
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-base font-bold tabular-nums", h.totalScore >= 50 ? "text-good" : "text-warn")}>
                    {h.totalScore}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data.length >= 2 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">診断結果の指標比較</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2 pr-3 font-medium">指標</th>
                    {data.map((d) => (
                      <th key={d.id} className="px-3 py-2 font-medium">
                        <span className="block max-w-40 truncate" title={d.title}>{d.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {cols.map((c) => (
                    <tr key={c.key} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-muted">{c.label}</td>
                      {data.map((d) => (
                        <td key={d.id} className="px-3 py-2 tabular-nums">{d[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted">
                スコアは投稿前チェックの達成度を示すもので、いずれかの案の結果を予測するものではありません。
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function ComparePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">比較</h1>
        <p className="mt-1 text-sm text-muted">
          サムネイル・タイトル案・履歴の診断結果を比較できます。すべてブラウザ内で処理されます。
        </p>
      </div>
      <ThumbCompare />
      <TitleAbCompare />
      <DiagnosisCompare />
    </div>
  );
}