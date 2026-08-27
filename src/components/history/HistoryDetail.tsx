"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DiagnosisResult } from "@/types";
import { Button, Card } from "@/components/ui";
import { EmptyState } from "@/components/Doodles";
import { ScoreSection } from "@/components/diagnose/ScoreSection";
import { ChecklistSection } from "@/components/diagnose/ChecklistSection";
import { ThumbnailSection } from "@/components/diagnose/ThumbnailSection";
import { TitleSection } from "@/components/diagnose/TitleSection";
import { RelationSection, DescriptionSection, ChapterSection, HashtagSection } from "@/components/diagnose/TextSections";
import { useHistory } from "@/hooks/useHistory";
import { downloadResultPng } from "@/lib/export";

export function HistoryDetail({ id }: { id: string }) {
  const { history, loaded } = useHistory();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const entry = loaded ? history.find((h) => h.id === id) : undefined;

  // Reset the preview whenever the target thumbnail changes (render-phase
  // state adjustment); the async IndexedDB read happens in the effect below.
  const [loadedThumbKey, setLoadedThumbKey] = useState<string | null>(null);
  const thumbId = entry?.thumbnailId ?? null;
  if (thumbId && thumbId !== loadedThumbKey) {
    setLoadedThumbKey(thumbId);
    setBlobUrl(null);
  }

  useEffect(() => {
    if (!thumbId) return;
    let url: string | null = null;
    let cancelled = false;
    void (async () => {
      const { loadThumbnailBlob } = await import("@/lib/storage");
      const blob = await loadThumbnailBlob(thumbId);
      if (!cancelled && blob) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [thumbId]);

  if (!loaded) {
    return <p className="text-sm text-muted">読み込み中…</p>;
  }

if (!entry) {
    return (
      <EmptyState
        art="note"
        title="指定された履歴が見つかりません。"
        description="履歴は端末ごとに保存されます。別の端末で診断した結果は、ここには表示されません。"
        action={
          <Link href="/history">
            <Button size="lg">履歴一覧へ戻る</Button>
          </Link>
        }
      />
    );
  }

  const result: DiagnosisResult = entry.result;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/history" className="text-sm text-accent underline">
            ← 履歴一覧へ戻る
          </Link>
          <h1 className="truncate text-xl font-bold text-foreground">{result.input.title || "（タイトル未入力）"}</h1>
          <p className="mt-1 text-xs text-muted">
            {new Date(result.createdAt).toLocaleString("ja-JP")}
            {" ・ "}総合スコア <span className="font-bold tabular-nums text-foreground">{result.totalScore} / 100</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadResultPng(result)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2h16v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            PNG保存
          </Button>
          <Button onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 9V4h10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="5" y="9" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 14h10v6H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            印刷
          </Button>
          <Link href={`/diagnose?h=${id}`}>
            <Button variant="primary">この内容で再診断</Button>
          </Link>
        </div>
      </div>

      <div className="no-print space-y-6">
        <ScoreSection result={result} />
        {result.thumbnail && <ThumbnailSection analysis={result.thumbnail} previewUrl={blobUrl} />}
        {result.title && <TitleSection analysis={result.title} />}
        {result.relation && <RelationSection rel={result.relation} />}
        {result.description && <DescriptionSection d={result.description} />}
        {result.chapters && <ChapterSection c={result.chapters} />}
        {result.hashtags && result.hashtags.count > 0 && <HashtagSection h={result.hashtags} />}
        <ChecklistSection result={result} />
        {result.input.genre || result.input.target ? (
          <Card ariaLabel="診断時の入力情報">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              {result.input.genre && <p>ジャンル: <span className="text-foreground">{result.input.genre}</span></p>}
              {result.input.target && <p>ターゲット: <span className="text-foreground">{result.input.target}</span></p>}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}