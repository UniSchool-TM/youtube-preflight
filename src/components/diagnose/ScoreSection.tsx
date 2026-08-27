"use client";

import type { DiagnosisResult, ScoreCategory } from "@/types";
import {
  Card,
  ProgressBar,
  SectionHeading,
  SeverityBadge,
  severityColorClass,
  cn,
} from "@/components/ui";
import { MessageList } from "@/components/diagnose/analysisViews";

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score / 100));
  const color =
    pct >= 0.85 ? "text-good" : pct >= 0.5 ? "text-warn" : "text-crit";
  const R = 88;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <div className="relative h-52 w-52 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label={`総合スコア ${score} 点`}>
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="16" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className={cn("transition-all duration-700", color)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-muted">投稿準備度</p>
          <p className={cn("text-5xl font-bold tabular-nums", color)}>{score}</p>
          <p className="text-sm text-muted">/ 100</p>
        </div>
      </div>
      <div className="max-w-md space-y-3">
        <p className="text-base font-semibold text-foreground">総合スコア</p>
        <p className="text-sm leading-relaxed text-muted">
          投稿前チェック項目の達成度を独自基準でスコア化しています。
          <strong className="text-foreground"> CTRや再生数を予測するものではありません。</strong>
        </p>
        <p className="text-xs leading-relaxed text-muted">
          スコアは同じ入力なら必ず同じ結果になるルールベース方式です（AIによる曖昧な評価は行いません）。各項目の「内訳」で点数理由を確認できます。
        </p>
      </div>
    </div>
  );
}

function CategoryRow({ cat }: { cat: ScoreCategory }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{cat.label}</span>
          <SeverityBadge severity={cat.severity} />
        </div>
        <p className="text-lg font-bold tabular-nums text-foreground">
          {cat.earned}
          <span className="text-sm font-medium text-muted"> / {cat.max}</span>
        </p>
      </div>
      <ProgressBar
        value={cat.earned}
        max={cat.max}
        colorClass={severityColorClass(cat.severity)}
      />
      {cat.reasons.length > 0 && (
        <details className="mt-1 group">
          <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">
            なぜこの点数になったのか（{cat.reasons.length} 件）
          </summary>
          <div className="mt-3">
            <MessageList reasons={cat.reasons} compact />
          </div>
        </details>
      )}
    </div>
  );
}

export function ScoreSection({ result }: { result: DiagnosisResult }) {
  return (
    <Card ariaLabel="総合スコア" className="scroll-mt-24">
      <SectionHeading
        title="投稿準備度"
        description="入力内容をルールベースで自動採点した結果です。"
      />
      <ScoreGauge score={result.totalScore} />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {result.scores.map((cat) => (
          <CategoryRow key={cat.key || cat.label} cat={cat} />
        ))}
      </div>
    </Card>
  );
}