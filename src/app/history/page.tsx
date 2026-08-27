"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, cn } from "@/components/ui";
import { useHistory } from "@/hooks/useHistory";
import { HistoryDetail } from "@/components/history/HistoryDetail";
import { EmptyState } from "@/components/Doodles";

export default function HistoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">読み込み中…</p>}>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const detailId = searchParams.get("id");
  const { history, loaded, remove, clear } = useHistory();

  const handleClearAll = () => {
    if (window.confirm("すべての履歴とサムネイル画像を削除しますか？この操作は取り消せません。")) {
      void clear();
    }
  };

  if (detailId) {
    return <HistoryDetail id={detailId} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">履歴</h1>
          <p className="mt-1 text-sm text-muted">
            ブラウザ内（この端末のみ）に保存された診断結果です。最大200件。画像はIndexedDBに保存されます。
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClearAll}>すべて削除</Button>
        </div>
      </div>

      {!loaded ? (
        <div className="rounded-[20px] border border-border bg-card p-6">
          <p className="text-sm text-muted">読み込み中…</p>
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          art="clip"
          title="履歴はまだありません。"
          description="診断を終えると、結果がこの端末に保存されます（最大200件）。"
          action={
            <Link href="/diagnose">
              <Button variant="primary" size="lg">診断を始める</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id}>
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-accent/50">
                <div
                  className={cn(
                    "flex h-12 w-16 shrink-0 items-center justify-center rounded-lg text-lg font-bold tabular-nums",
                    h.totalScore >= 85
                      ? "bg-good/10 text-good"
                      : h.totalScore >= 50
                        ? "bg-warn/10 text-warn"
                        : "bg-crit/10 text-crit"
                  )}
                >
                  {h.totalScore}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/history?id=${h.id}`} className="block truncate font-semibold text-foreground hover:underline">
                    {h.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {new Date(h.createdAt).toLocaleString("ja-JP")}
                    {" ・ "}
                    {h.hasThumbnail ? "サムネイルあり" : "サムネイルなし"}
                    {" ・ "}
                    {h.criticalCount > 0 ? (
                      <span className="font-semibold text-crit">要修正 {h.criticalCount}</span>
                    ) : h.warningCount > 0 ? (
                      <span className="font-semibold text-warn">要改善 {h.warningCount}</span>
                    ) : (
                      <span className="text-good">問題なし</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/diagnose?h=${h.id}`}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-accent hover:text-accent"
                  >
                    この内容で再診断
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(h.id)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:border-crit hover:text-crit"
                    aria-label={`履歴 ${h.title} を削除`}
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}