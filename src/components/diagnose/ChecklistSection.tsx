"use client";

import type { DiagnosisResult } from "@/types";
import { Card, ChecklistBadge, SectionHeading, cn } from "@/components/ui";
import { allPass } from "@/lib/diagnose";

export function ChecklistSection({ result }: { result: DiagnosisResult }) {
  const { critical, warning, info } = result.summary;
  const done = allPass(result);
  const status = done
    ? { text: "投稿前チェック完了", cls: "border-good/50 bg-good/10 text-good" }
    : critical > 0
      ? { text: "要修正項目があります（Critical）", cls: "border-crit/50 bg-crit/10 text-crit" }
      : warning > 0
        ? { text: "改善を推奨する項目があります（Warning）", cls: "border-warn/50 bg-warn/10 text-warn" }
        : { text: "おおむね問題ありません（Info）", cls: "border-info/50 bg-info/10 text-info" };

  return (
    <Card ariaLabel="投稿前チェックリスト">
      <SectionHeading
        icon="✅"
        title="投稿前チェック"
        description="投稿前に確認すべき項目を 3 段階（Critical / Warning / Info）で表示します。"
        right={
          <p className="text-sm text-muted">
            Critical <span className="font-bold text-crit">{critical}</span> ／ Warning{" "}
            <span className="font-bold text-warn">{warning}</span> ／ Info{" "}
            <span className="font-bold text-info">{info}</span>
          </p>
        }
      />
      <div
        className={cn(
          "mb-5 rounded-xl border px-4 py-3 text-center text-base font-bold",
          status.cls
        )}
        role="status"
      >
        {done ? "✓ " : ""}
        {status.text}
      </div>
      <ul className="space-y-1.5">
        {result.checklist.map((c) => (
          <li
            key={c.key}
            className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-border/30"
          >
            <ChecklistBadge status={c.status} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{c.label}</p>
              <p className="text-xs text-muted">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        チェックはこのツールのルールに基づく機械的な判定です。最終判断は必ずご自身で行ってください。
      </p>
    </Card>
  );
}