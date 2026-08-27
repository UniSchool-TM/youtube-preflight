"use client";

import type {
  ChapterAnalysis,
  DescriptionAnalysis,
  HashtagAnalysis,
  TitleThumbnailRelation,
} from "@/types";
import { Card, SectionHeading, cn } from "@/components/ui";
import { MessageList, StatGrid } from "@/components/diagnose/analysisViews";

/* ------------------------------------------------------------------ */
/* Title × Thumbnail relation                                          */
/* ------------------------------------------------------------------ */

export function RelationSection({ rel }: { rel: TitleThumbnailRelation }) {
  const fmtWords = (w: string[]) => (w.length === 0 ? "なし" : w.join(" / "));
  const overlap = (rel.overlapRatio * 100).toFixed(0);
  return (
    <Card ariaLabel="タイトルとサムネイルの関係">
      <SectionHeading
        title="タイトル × サムネイル文字"
        description="タイトルの語と「サムネイル文字」欄の語を比較しました。OCRや外部サービスは使用していません。"
        right={
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-accent">
              {overlap}
              <span className="text-sm font-medium text-muted">%</span>
            </p>
            <p className="text-xs text-muted">重複率</p>
          </div>
        }
      />
      <StatGrid
        items={[
          { label: "完全一致語", value: fmtWords(rel.exactMatches) },
          { label: "サムネイル文字（語）", value: fmtWords(rel.thumbnailTextWords) },
          { label: "数字の一致", value: rel.digitMatches.length > 0 ? rel.digitMatches.join(", ") : "なし" },
        ]}
      />
      <div className="mt-4">
        <MessageList reasons={rel.messages} />
      </div>
      {rel.hasTitle && rel.hasThumbnailText && rel.overlapRatio >= 0.5 && (
        <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn" role="note">
          タイトルとサムネイルが同じ情報を繰り返している場合、役割が重複している可能性があります。タイトルは「文脈」を、サムネイルは「瞬間の視覚情報」を担うよう分担させると効果的です。
        </p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Description                                                         */
/* ------------------------------------------------------------------ */

export function DescriptionSection({ d }: { d: DescriptionAnalysis }) {
  return (
    <Card ariaLabel="概要欄の解析結果">
      <SectionHeading
        title="概要欄の解析"
        description="文字数・URL・ハッシュタグ・改行構造を確認します。"
      />
      <StatGrid
        items={[
          { label: "文字数", value: d.length },
          { label: "行数", value: d.lineCount },
          { label: "URL数", value: d.urlCount, note: `HTTPS以外 ${d.nonHttpsCount}` },
          { label: "ハッシュタグ数", value: d.hashtagCount },
          { label: "メンション数", value: d.mentionCount },
          { label: "絵文字数", value: d.emojiCount },
          { label: "空行", value: d.emptyLineCount, note: `最大連続 ${d.maxConsecutiveEmptyLines}` },
          { label: "冒頭文の長さ", value: `${d.firstLineLength} 文字` },
        ]}
      />
      {d.urls.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">概要欄に含まれるURL一覧</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">URL</th>
                <th scope="col" className="py-2 pr-3 font-medium">ドメイン</th>
                <th scope="col" className="py-2 font-medium">HTTPS</th>
              </tr>
            </thead>
            <tbody>
              {d.urls.slice(0, 20).map((u, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="break-all py-2 pr-3 font-mono text-xs text-foreground">{u.raw}</td>
                  <td className="py-2 pr-3 text-xs text-muted">{u.host || "（解析不可）"}</td>
                  <td className="py-2 text-xs">
                    {u.scheme ? (
                      <span className={u.isHttps ? "text-good" : "text-warn"}>
                        {u.isHttps ? "https ✓" : "http"}
                      </span>
                    ) : (
                      <span className="text-crit">不正</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.urls.length > 20 && (
            <p className="mt-2 text-xs text-muted">ほか {d.urls.length - 20} 件（表示省略）</p>
          )}
        </div>
      )}
      {d.warnings.length > 0 && (
        <div className="mt-4">
          <MessageList reasons={d.warnings} />
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        URLは形式・存在のみをチェックしています。外部サイトへのアクセスや安全性判定は行いません。
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Chapters                                                            */
/* ------------------------------------------------------------------ */

export function ChapterSection({ c }: { c: ChapterAnalysis }) {
  return (
    <Card ariaLabel="チャプターの解析結果">
      <SectionHeading
        title="チャプターの解析"
        description="時刻の形式・順序・動画尺との整合性を確認します。"
      />
      <StatGrid
        items={[
          { label: "検出チャプター数", value: c.chapters.length },
          { label: "不正な行", value: c.invalidLines.length },
          { label: "先頭が00:00", value: c.startsAtZero ? "✓" : "—" },
          { label: "昇順", value: c.isAscending ? "✓" : "✕" },
          { label: "重複時刻", value: c.hasDuplicates ? `✕ ${c.duplicateTimes.join(", ")}` : "なし" },
          { label: "動画尺超え", value: c.exceedsDuration ? "あり" : "なし" },
          { label: "タイトルなし", value: `${c.missingTitles} 件` },
          { label: "最短間隔", value: c.minGap === null ? "—" : `${c.minGap} 秒` },
        ]}
      />
      {c.invalidLines.length > 0 && (
        <div className="mt-4 rounded-lg border border-crit/40 bg-crit/10 px-3 py-2">
          <p className="text-sm font-semibold text-crit">形式が不正な行（時刻として解釈できません）:</p>
          <ul className="mt-1 list-inside text-sm text-crit/90">
            {c.invalidLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      {c.chapters.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <caption className="sr-only">チャプターの時刻とタイトル</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">時刻</th>
                <th scope="col" className="py-2 font-medium">タイトル</th>
              </tr>
            </thead>
            <tbody>
              {c.chapters.map((ch, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs text-foreground">{ch.timeLabel}</td>
                  <td className={cn("py-2 text-sm", ch.title.trim() ? "text-foreground" : "text-warn italic")}>
                    {ch.title.trim() || "（タイトルなし）"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {c.warnings.length > 0 && (
        <div className="mt-4">
          <MessageList reasons={c.warnings} />
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Hashtags                                                            */
/* ------------------------------------------------------------------ */

export function HashtagSection({ h }: { h: HashtagAnalysis }) {
  return (
    <Card ariaLabel="ハッシュタグの解析結果">
      <SectionHeading
        title="ハッシュタグの解析"
        description="個数・重複・文字種を確認します。"
      />
      <StatGrid
        items={[
          { label: "登録数", value: h.count },
          { label: "一意の数", value: h.uniqueCount },
          { label: "重複", value: h.duplicates.length > 0 ? h.duplicates.join(", ") : "なし" },
          { label: "合計文字数", value: h.totalChars },
          { label: "最長タグ", value: `${h.maxLength} 文字` },
        ]}
      />
      {h.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="ハッシュタグ一覧">
          {h.tags.map((t, i) => (
            <li
              key={i}
              className="rounded-full border border-border bg-background/50 px-3 py-1 text-sm text-foreground"
              title={[
                t.hasJapanese && "日本語",
                t.hasEnglish && "英語",
                t.hasDigits && "数字",
                t.hasSpecial && "特殊文字",
              ]
                .filter(Boolean)
                .join(" ／ ")}
            >
              #{t.tag}
              <span className="ml-2 text-xs text-muted">{t.length}</span>
            </li>
          ))}
        </ul>
      )}
      {h.warnings.length > 0 && (
        <div className="mt-4">
          <MessageList reasons={h.warnings} />
        </div>
      )}
    </Card>
  );
}