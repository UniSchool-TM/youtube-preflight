"use client";

import { useMemo } from "react";
import type { TitleAnalysis } from "@/types";
import { Card, SectionHeading, cn } from "@/components/ui";
import { StatGrid, TokenFlow, MessageList } from "@/components/diagnose/analysisViews";
import {
  DEVICE_LABELS,
  DEVICE_WIDTHS,
  simulateTitleVisibility,
  warnTextForCut,
} from "@/lib/titleSim";

function StructureBadges({ a }: { a: TitleAnalysis }) {
  const s = a.structure;
  const items: [string, boolean][] = [
    ["【】", s.squareBrackets],
    ["「」", s.cornerBrackets],
    ["()", s.parens],
    ["!", s.exclamation],
    ["?", s.question],
    ["：", s.colon],
    ["数字", s.hasDigits],
    ["疑問形", s.isQuestionForm],
    ["感嘆表現", s.hasExclamationMark],
    ["繰り返し", s.repeatedChar],
  ];
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="タイトルの構造要素">
      {items.map(([label, on]) => (
        <span
          key={label}
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            on
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border text-muted"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function DevicePreview({
  device,
  text,
  cut,
}: {
  device: "pc" | "tablet" | "phone";
  text: string;
  cut: { truncated: boolean };
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{DEVICE_LABELS[device]}</span>
        <span className="text-[10px] text-muted">幅 {DEVICE_WIDTHS[device]}px</span>
      </div>
      <div
        className="rounded-md border border-border bg-background/60 px-2 py-1.5 text-foreground"
        style={{ maxWidth: DEVICE_WIDTHS[device], fontSize: 18, fontWeight: 600 }}
      >
        <p
          className={cn(
            "leading-snug",
            device === "pc" ? "line-clamp-1" : "line-clamp-2"
          )}
          title={text}
        >
          {text || "（未入力）"}
        </p>
      </div>
      {cut.truncated && (
        <p className="text-[11px] text-warn" role="note">
          … 途中で切れる可能性があります
        </p>
      )}
    </div>
  );
}

export function TitleSection({ analysis }: { analysis: TitleAnalysis }) {
  const cuts = useMemo(
    () =>
      simulateTitleVisibility(
        analysis.raw,
        analysis.tokens,
        { pc: 1, tablet: 2, phone: 2 }
      ),
    [analysis]
  );

  const warnings = analysis.overuseIssues.filter(
    (i) => i.severity === "warning" || i.severity === "critical"
  );

  return (
    <div className="space-y-6">
      <Card ariaLabel="タイトル文字数分析">
        <SectionHeading
          title="タイトル文字構成"
          description="文字数と文字種の内訳（Unicodeコードポイント基準、ブラウザ内で計算）。"
        />
        <StatGrid
          items={[
            { label: "文字数", value: analysis.counts.total, note: "コードポイント" },
            { label: "日本語", value: analysis.counts.japanese, note: `漢字 ${analysis.counts.kanji} / ひらがな ${analysis.counts.hiragana} / カタカナ ${analysis.counts.katakana}` },
            { label: "英数字", value: analysis.counts.alnum, note: `英字 ${analysis.counts.letters} / 数字 ${analysis.counts.digits}` },
            { label: "記号", value: analysis.counts.symbols },
            { label: "絵文字", value: analysis.counts.emoji },
            { label: "空白", value: analysis.counts.whitespace },
          ]}
        />
      </Card>

      <Card ariaLabel="タイトル構造分析">
        <SectionHeading
          title="構造"
          description="記号・疑問形・感嘆表現の有無を検出します。"
        />
        <StructureBadges a={analysis} />
        {analysis.structure.repeatedSequences.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            繰り返しパターン: {analysis.structure.repeatedSequences.join(" / ")}
          </p>
        )}
        {warnings.length > 0 && (
          <div className="mt-4">
            <MessageList
              reasons={warnings.map((w) => ({ type: w.severity, text: `${w.label}: ${w.detail}` }))}
            />
          </div>
        )}
      </Card>

      <Card ariaLabel="重要語の位置分析">
        <SectionHeading
          title="重要語の位置分析"
          description="数字・カタカナ語・漢字・大文字英単語などをルールベースで「重要語」とみなした配置を分析します（AIによる意味理解ではありません）。"
          right={
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-accent">
                {(analysis.frontInfoRatio * 100).toFixed(0)}
                <span className="text-sm font-medium text-muted">%</span>
              </p>
              <p className="text-xs text-muted">前方への重要語集中率</p>
            </div>
          }
        />
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <TokenFlow tokens={analysis.tokens} />
        </div>
        <p className="mt-3 text-sm text-foreground/90">{analysis.frontInfoReason}</p>
        {analysis.tokens.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            重要語らしき語を検出できませんでした。タイトル全体がひらがな・絵文字・記号のみの場合に発生します。
          </p>
        )}
      </Card>

      <Card ariaLabel="タイトル表示シミュレーター">
        <SectionHeading
          title="タイトル表示シミュレーター"
          description="各デバイスの想定表示幅でタイトルがどのように表示されるかを確認できます。"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {cuts.map((cut) => (
            <div key={cut.device} className="space-y-2">
              <DevicePreview device={cut.device} text={analysis.raw} cut={cut} />
              {(() => {
                const w = warnTextForCut(cut);
                return w ? (
                  <p className="rounded-md border border-warn/40 bg-warn/10 px-2 py-1.5 text-xs text-warn" role="note">
                    {w}
                  </p>
                ) : null;
              })()}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          実際より重要な情報が後半に偏っている場合、小さい画面では伝わりにくくなることがあります。
        </p>
      </Card>
    </div>
  );
}