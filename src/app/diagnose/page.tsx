"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  DiagnosisInput,
  DiagnosisResult,
  ThumbnailAnalysis,
  ThumbnailFile,
} from "@/types";
import { Button, Card, ErrorNotice, Field, SectionHeading, inputClass } from "@/components/ui";
import { ThumbnailUploader, ThumbnailSimulator } from "@/components/diagnose/ThumbnailUploader";
import { ThumbnailSection } from "@/components/diagnose/ThumbnailSection";
import { TitleSection } from "@/components/diagnose/TitleSection";
import { RelationSection, DescriptionSection, ChapterSection, HashtagSection } from "@/components/diagnose/TextSections";
import { ScoreSection } from "@/components/diagnose/ScoreSection";
import { ChecklistSection } from "@/components/diagnose/ChecklistSection";
import { AiImproveCard } from "@/components/diagnose/AiImproveCard";
import { DurationInput } from "@/components/diagnose/DurationInput";
import { HashtagInput } from "@/components/diagnose/HashtagInput";
import { PrintSheet } from "@/components/diagnose/PrintSheet";
import { GENRES } from "@/lib/genres";
import { analyzeTextInputs, generateId, runDiagnosis } from "@/lib/diagnose";
import { analyzeThumbnailFile } from "@/lib/imageDecode";
import { downloadResultPng } from "@/lib/export";
import { useSettings } from "@/hooks/useTheme";
import { useHistory } from "@/hooks/useHistory";
import { parseDuration } from "@/lib/duration";
import { formatSeconds } from "@/lib/duration";

const EMPTY_FORM = {
  title: "",
  description: "",
  durationRaw: "",
  genre: "",
  target: "",
  thumbnailText: "",
  chaptersRaw: "",
  hashtagsRaw: "",
};

interface FormFields {
  title: string;
  description: string;
  durationRaw: string;
  genre: string;
  target: string;
  thumbnailText: string;
  chaptersRaw: string;
  hashtagsRaw: string;
}

const CHAPTER_PLACEHOLDER = `00:00 オープニング
01:24 第一章
04:32 第二章
07:55 まとめ`;

export default function DiagnosePage() {
  return (
    <Suspense fallback={<p className="text-muted">読み込み中…</p>}>
      <DiagnoseContent />
    </Suspense>
  );
}

function DiagnoseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams.get("h");

  const [form, setForm] = useState<FormFields>({ ...EMPTY_FORM });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbMeta, setThumbMeta] = useState<ThumbnailFile | null>(null);
  const [analysis, setAnalysis] = useState<ThumbnailAnalysis | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "working" | "done" | "error">("idle");
  const [phaseMsg, setPhaseMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [restoredId] = useState<string | null>(historyId);
  const resultRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const history = useHistory();
  const previewRef = useRef<string | null>(null);

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setResult(null);
  };

  const setSelect = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setResult(null);
  };

  // Object URL lifecycle
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.toString());
    };
  }, []);

  const selectFile = (f: File) => {
    const meta: ThumbnailFile = {
      id: generateId(),
      name: f.name,
      type: f.type,
      size: f.size,
      dataUrl: "",
    };
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current.toString());
    }
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreviewUrl(url);
    setThumbMeta(meta);
    setAnalysis(null);
    setResult(null);
  };

  const removeFile = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current.toString());
    previewRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setThumbMeta(null);
    setAnalysis(null);
    setResult(null);
  };

  // Restore from history (?h=id): state is set during render using the
  // "adjusting state when props change" pattern; async work (IndexedDB read,
  // redirect) runs in an effect below.
  const [resolvedRestored, setResolvedRestored] = useState<string | null>(null);
  const restoreEntry = restoredId && history.loaded
    ? history.history.find((h) => h.id === restoredId)
    : undefined;
  if (restoreEntry && restoredId !== resolvedRestored) {
    setResolvedRestored(restoredId);
    const input = restoreEntry.result.input;
    setForm({
      title: input.title || "",
      description: input.description || "",
      durationRaw: input.durationRaw || "",
      genre: input.genre || "",
      target: input.target || "",
      thumbnailText: input.thumbnailText || "",
      chaptersRaw: input.chaptersRaw || "",
      hashtagsRaw: input.hashtagsRaw || "",
    });
    setResult(restoreEntry.result);
    setPhase("done");
    setError(null);
  }

  useEffect(() => {
    if (!restoredId || !history.loaded) return;
    const entry = history.history.find((h) => h.id === restoredId);
    if (!entry) {
      router.replace("/diagnose");
      return;
    }
    if (!entry.thumbnailId) return;
    const thumbnailId = entry.thumbnailId;
    void (async () => {
      const { loadThumbnailBlob } = await import("@/lib/storage");
      const blob = await loadThumbnailBlob(thumbnailId);
      if (!blob) return;
      const f = new File([blob], entry.input.thumbnail?.name || "thumbnail", {
        type: entry.input.thumbnail?.type || "image/png",
      });
      const url = URL.createObjectURL(f);
      previewRef.current = url;
      setFile(f);
      setPreviewUrl(url);
      setThumbMeta({
        id: thumbnailId,
        name: f.name,
        type: f.type,
        size: f.size,
        dataUrl: "",
      });
      setAnalysis(entry.result.thumbnail ?? null);
    })();
  }, [restoredId, history.loaded, history.history, router]);

  const setAnalyzedResult = (r: DiagnosisResult) => {
    setResult(r);
    setPhase("done");
    setError(null);
  };

  const hasEmptyWarning = form.title.trim() === "";

  const durationParsed = useMemo(() => parseDuration(form.durationRaw), [form.durationRaw]);

  const toInput = (): DiagnosisInput => ({
    title: form.title,
    description: form.description,
    durationRaw: form.durationRaw,
    durationSeconds: durationParsed.seconds,
    genre: form.genre,
    target: form.target,
    thumbnailText: form.thumbnailText,
    chaptersRaw: form.chaptersRaw,
    hashtagsRaw: form.hashtagsRaw,
    thumbnail: thumbMeta,
  });

  const diagnose = async () => {
    setError(null);
    setPhase("working");
    setPhaseMsg("入力内容を解析しています…");
    const input = toInput();
    const textBundle = analyzeTextInputs(input);

    let analysisRes: ThumbnailAnalysis | null = null;
    if (file) {
      setPhaseMsg("サムネイルを解析しています（ブラウザ内処理）…");
      try {
        const { analysis: a, bitmap } = await analyzeThumbnailFile(file);
        bitmap.close();
        analysisRes = a;
        setAnalysis(a);
      } catch (e) {
        setError(e instanceof Error ? e.message : "画像解析に失敗しました。画像を再度アップロードしてください。");
        setPhase("error");
        return;
      }
    } else {
      analysisRes = analysis;
    }

    const res = runDiagnosis(input, analysisRes, textBundle);
    setAnalyzedResult(res);
    if (settings.historyEnabled) {
      void history.saveResult(res, file);
    }
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const resetAll = () => {
    if (!window.confirm("すべての入力・サムネイル・診断結果を削除しますか？")) return;
    setForm({ ...EMPTY_FORM });
    removeFile();
    setAnalysis(null);
    setResult(null);
    setPhase("idle");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasDiagnosed = phase === "done" && result !== null;

  return (
    <div className="space-y-8">
      <section aria-label="入力フォーム" className="no-print space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">診断</h1>
          <p className="mt-1 text-sm text-muted">
            タイトル・サムネイル・概要欄などを入力し「診断を開始」で投稿前チェックを実行します。すべてブラウザ内で処理され、外部へ送信されません。
          </p>
        </div>

        {/* Video info */}
        <Card ariaLabel="動画情報">
          <SectionHeading title="動画情報" />
          <div className="grid gap-5 md:grid-cols-2">
            <Field htmlFor="title" label="動画タイトル" required hint="100文字以内を推奨">
              <input id="title" className={inputClass} value={form.title} onChange={set("title")} placeholder="例: 【徹底比較】動画編集ソフトを1年間使った結果" />
            </Field>
            <DurationInput
              value={form.durationRaw}
              onChange={(v) => {
                setForm((f) => ({ ...f, durationRaw: v }));
                setResult(null);
              }}
            />
            <Field
              htmlFor="genre"
              label="ジャンル"
              hint="YouTube Studio の動画「カテゴリ」と同じ公式ジャンル15種から選択できます。"
            >
              <select
                id="genre"
                className={inputClass}
                value={form.genre}
                onChange={setSelect("genre")}
              >
                <option value="">選択しない（任意）</option>
                {GENRES.map((g) => (
                  <option key={g.id} value={g.label}>
                    {g.label}
                  </option>
                ))}
                {form.genre &&
                  !GENRES.some((g) => g.label === form.genre) && (
                    <option value={form.genre}>{form.genre}</option>
                  )}
              </select>
            </Field>
            <Field htmlFor="target" label="ターゲット" hint="任意（想定視聴者）">
              <input id="target" className={inputClass} value={form.target} onChange={set("target")} placeholder="例: 副業で動画編集を始めたい人" />
            </Field>
          </div>
        </Card>

        {/* Description */}
        <Card ariaLabel="概要欄">
          <SectionHeading title="概要欄" />
          <Field htmlFor="description" label="概要欄テキスト">
            <textarea
              id="description"
              rows={8}
              className={inputClass}
              value={form.description}
              onChange={set("description")}
              placeholder={"1行目は最初の約100文字が検索・共有時によく表示されます。\n\n目次・関連リンク・チャプターなどを記載しましょう。"}
            />
          </Field>
        </Card>

        {/* Thumbnail */}
        <Card ariaLabel="サムネイル">
          <SectionHeading
            title="サムネイル"
            description="画像はブラウザ内でのみ解析します。外部へアップロードされません。"
          />
          <ThumbnailUploader
            file={file}
            previewUrl={previewUrl}
            onSelect={selectFile}
            onRemove={removeFile}
            analyzeState={phase === "working" && file ? "analyzing" : file && analysis ? "done" : file ? "idle" : "idle"}
          />
          <div className="mt-4">
            <Field htmlFor="thumbtext" label="サムネイル文字（任意）" hint="サムネイル上に書いた文字を入力すると、タイトルとの重複・数字の一致をチェックします（OCRは使用しません）。">
              <input id="thumbtext" className={inputClass} value={form.thumbnailText} onChange={set("thumbnailText")} placeholder="例: 1年間で収益が出た" />
            </Field>
          </div>
        </Card>

        {/* Chapters */}
        <Card ariaLabel="チャプター">
          <SectionHeading title="チャプター" description="MM:SS または HH:MM:SS とタイトルを1行ずつ入力します。" />
          <Field htmlFor="chapters" label="チャプター">
            <textarea
              id="chapters"
              rows={6}
              className={inputClass + " font-mono"}
              value={form.chaptersRaw}
              onChange={set("chaptersRaw")}
              placeholder={CHAPTER_PLACEHOLDER}
            />
          </Field>
        </Card>

        {/* Hashtags */}
        <Card ariaLabel="ハッシュタグ">
          <SectionHeading
            title="ハッシュタグ"
            description="Enter または , で入力した語をハッシュタグとして確定できます。「# 付きでも # なしでもOKです。」"
          />
          <Field htmlFor="hashtag-input" label="ハッシュタグ（任意）">
            <HashtagInput
              value={form.hashtagsRaw}
              onChange={(v) => {
                setForm((f) => ({ ...f, hashtagsRaw: v }));
                setResult(null);
              }}
            />
          </Field>
        </Card>

        {error && <ErrorNotice message={error} />}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => void diagnose()} disabled={phase === "working"} className="px-6 py-3 text-base">
            {phase === "working" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                解析中…
              </>
            ) : (
              "診断を開始"
            )}
          </Button>
          <span className="text-xs text-muted">
            {hasEmptyWarning && "タイトル未入力のまま診断するとスコアは大幅に下がります。"}
            {form.description.trim() === "" && !hasEmptyWarning && "概要欄未入力です。"}
          </span>
          <button type="button" onClick={resetAll} className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-crit">
            すべてクリア
          </button>
        </div>
        {phase === "working" && (
          <p className="text-sm text-accent" role="status">
            {phaseMsg}（巨大画像は自動で縮小して解析します）
          </p>
        )}
      </section>

      {hasDiagnosed && result && (
        <>
          <div ref={resultRef} className="no-print flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => downloadResultPng(result)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2h16v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              診断結果をPNGで保存
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 9V4h10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="5" y="9" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 14h10v6H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              印刷 / PDF保存
            </Button>
          </div>

          <div className="no-print space-y-6">
            <ScoreSection result={result} />
            {result.thumbnail && (
              <ThumbnailSection
                analysis={result.thumbnail}
                previewUrl={previewUrl}
              />
            )}
            {previewUrl && <ThumbnailSimulator previewUrl={previewUrl} />}
            {result.title && <TitleSection analysis={result.title} />}
            {result.relation && <RelationSection rel={result.relation} />}
            {result.description && <DescriptionSection d={result.description} />}
            {result.chapters && <ChapterSection c={result.chapters} />}
            {result.hashtags && result.hashtags.count > 0 && <HashtagSection h={result.hashtags} />}
            <DurationCard
              raw={result.input.durationRaw}
              seconds={result.duration?.seconds ?? null}
            />
            <ChecklistSection result={result} />
            <AiImproveCard result={result} />
          </div>

          {/* Print-only sheet */}
          <PrintSheet result={result} />
        </>
      )}

      {!hasDiagnosed && (
        <p className="no-print text-center text-sm text-muted">
          入力内容を確認し「診断を開始」を押してください。
        </p>
      )}
    </div>
  );
}

function DurationCard({ raw, seconds }: { raw: string; seconds: number | null }) {
  if (!raw.trim()) {
    return (
      <Card ariaLabel="動画尺">
        <SectionHeading title="動画尺" />
        <p className="text-sm text-muted">動画尺が未入力です。チャプターとの整合チェックのため入力することを推奨します。</p>
      </Card>
    );
  }
  const total = seconds ?? 0;
  return (
    <Card ariaLabel="動画尺">
      <SectionHeading title="動画尺" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-sm text-muted">入力</p>
          <p className="font-mono text-lg font-semibold text-foreground">{raw.trim()}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-sm text-muted">秒数換算</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{total} 秒</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-sm text-muted">標準表記</p>
          <p className="font-mono text-lg font-semibold text-foreground">{formatSeconds(total)}</p>
        </div>
      </div>
    </Card>
  );
}