import type {
  ChapterAnalysis,
  ChecklistItem,
  ChecklistStatus,
  DescriptionAnalysis,
  DiagnosisInput,
  DiagnosisResult,
  DiagnosisSummary,
  DurationAnalysis,
  HashtagAnalysis,
  ScoreCategory,
  Severity,
  ThumbnailAnalysis,
  TitleAnalysis,
  TitleThumbnailRelation,
} from "@/types";
import { analyzeChapters } from "@/lib/chapter";
import { analyzeDescription } from "@/lib/description";
import { parseDuration } from "@/lib/duration";
import { findGenreKeyword } from "@/lib/genres";
import { analyzeHashtags } from "@/lib/hashtag";
import { analyzeTitle } from "@/lib/title";
import { analyzeTitleThumbnail } from "@/lib/titleThumbnail";
import {
  scoreChapters,
  scoreDescription,
  scoreHashtags,
  scoreTechnical,
  scoreThumbnail,
  scoreTitle,
  scoreTitleThumbnail,
} from "@/lib/scoring";

export const PRIVACY_NOTE =
  "このツールは、入力された情報を外部AIや外部APIへ送信せず、可能な限りブラウザ内で処理します。";

export function generateId(): string {
  return `yp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const emptyDuration: DurationAnalysis = { raw: "", seconds: null, valid: false, errors: [] };

export interface TextAnalysisBundle {
  title: TitleAnalysis | null;
  description: DescriptionAnalysis | null;
  chapters: ChapterAnalysis | null;
  hashtags: HashtagAnalysis | null;
  duration: DurationAnalysis;
  relation: TitleThumbnailRelation | null;
}

/** Synchronous analysis of all text inputs. */
export function analyzeTextInputs(input: DiagnosisInput): TextAnalysisBundle {
  const title = input.title.trim().length > 0 ? analyzeTitle(input.title) : null;
  const description = analyzeDescription(input.description);
  const duration = input.durationRaw.trim() ? parseDuration(input.durationRaw) : { ...emptyDuration, raw: input.durationRaw };
  const chapters = analyzeChapters(input.chaptersRaw, duration.seconds);
  const hashtags = analyzeHashtags(input.hashtagsRaw);
  const relation = analyzeTitleThumbnail(input.title, input.thumbnailText);
  return { title, description, chapters, hashtags, duration, relation };
}

export function emptyDescriptionAnalysis(): DescriptionAnalysis {
  return {
    length: 0,
    lineCount: 1,
    urlCount: 0,
    hashtagCount: 0,
    mentionCount: 0,
    emptyLineCount: 0,
    maxConsecutiveEmptyLines: 0,
    emojiCount: 0,
    firstLineLength: 0,
    lineWidths: [],
    trailingWhitespace: false,
    unnaturalWhitespace: false,
    urls: [],
    duplicateUrls: [],
    nonHttpsCount: 0,
    hashtagDensity: 0,
    warnings: [],
  };
}

export function runDiagnosis(
  input: DiagnosisInput,
  thumbnail: ThumbnailAnalysis | null,
  text: TextAnalysisBundle
): DiagnosisResult {
  const { title, description, chapters, hashtags, duration, relation } = text;

  const scores: ScoreCategory[] = [
    scoreThumbnail(thumbnail),
    scoreTitle(title),
    scoreTitleThumbnail(relation),
    scoreDescription(description),
    scoreChapters(chapters),
    scoreHashtags(hashtags),
    scoreTechnical({
      thumbnailAnalyzed: thumbnail !== null,
      duration,
      chapters,
      description,
      titleAnalysis: title,
    }),
  ];

  const totalScore = scores.reduce((a, s) => a + s.earned, 0);
  const checklist = buildChecklist({
    thumbnail,
    title,
    relation,
    description,
    chapters,
    hashtags,
    duration,
    genre: input.genre,
    titleText: input.title,
    descriptionText: input.description,
  });
  const summary = summarize(checklist);

  return {
    id: generateId(),
    createdAt: Date.now(),
    input,
    thumbnail,
    title,
    description,
    chapters,
    hashtags,
    duration,
    relation,
    scores,
    totalScore,
    checklist,
    summary,
    privacyNote: PRIVACY_NOTE,
  };
}

/* ------------------------------------------------------------------ */
/* Checklist                                                           */
/* ------------------------------------------------------------------ */

interface BuildCtx {
  thumbnail: ThumbnailAnalysis | null;
  title: TitleAnalysis | null;
  relation: TitleThumbnailRelation | null;
  description: DescriptionAnalysis | null;
  chapters: ChapterAnalysis | null;
  hashtags: HashtagAnalysis | null;
  duration: DurationAnalysis;
  genre: string;
  titleText: string;
  descriptionText: string;
}

function item(key: string, label: string, status: ChecklistStatus, detail: string): ChecklistItem {
  return { key, label, status, detail };
}

function isBad(s: ChecklistStatus): s is "critical" | "warning" {
  return s === "critical" || s === "warning";
}

export function buildChecklist(ctx: BuildCtx): ChecklistItem[] {
  const out: ChecklistItem[] = [];
  const t = ctx.thumbnail;
  const hasThumb = t !== null;

  // Thumbnail checks
  if (!hasThumb) {
    out.push(item("thumb-resolution", "サムネイル解像度", "unset", "サムネイル未設定"));
    out.push(item("thumb-ratio", "サムネイル比率", "unset", "サムネイル未設定"));
    out.push(item("thumb-size", "サムネイル容量", "unset", "サムネイル未設定"));
    out.push(item("thumb-visibility", "サムネイル視認性", "unset", "サムネイル未設定"));
  } else {
    let st: ChecklistStatus;
    if (t.width >= 1280 && t.height >= 720) st = "pass";
    else if (t.width >= 640 && t.height >= 360) st = "warning";
    else st = "critical";
    out.push(item("thumb-resolution", "サムネイル解像度", st, `${t.width}x${t.height}`));

    const diff = Math.abs(t.aspectRatio - 16 / 9);
    st = diff <= 0.05 ? "pass" : diff <= 0.15 ? "warning" : "critical";
    out.push(item("thumb-ratio", "サムネイル比率", st, `実測値: ${t.aspectRatio.toFixed(3)}（16:9 推奨）`));

    const mb = t.fileSize / 1024 / 1024;
    st = mb <= 2 ? "pass" : mb <= 5 ? "info" : mb <= 10 ? "warning" : "critical";
    out.push(item("thumb-size", "サムネイル容量", st, `${mb.toFixed(2)}MB`));

    let badCount = 0;
    if (t.avgBrightness < 0.25 || t.avgBrightness > 0.85) badCount++;
    if (t.contrast < 0.1) badCount++;
    if (t.avgSaturation < 0.08 || t.avgSaturation > 0.88) badCount++;
    if (t.edgesPerPixel < 0.08 || t.edgesPerPixel > 0.55) badCount++;
    st = badCount === 0 ? "pass" : badCount === 1 ? "warning" : "critical";
    const vDetail =
      `明るさ ${(t.avgBrightness * 100).toFixed(0)}% / コントラスト ${t.contrast.toFixed(2)} / ` +
      `彩度 ${(t.avgSaturation * 100).toFixed(0)}% / 情報量 ${t.edgesPerPixel.toFixed(2)}`;
    out.push(item("thumb-visibility", "サムネイル視認性", st, st === "pass" ? "視認性は良好" : vDetail));
  }

  // Title length & structure
  const title = ctx.title;
  let st: ChecklistStatus;
  if (!title) {
    out.push(item("title-length", "タイトル長", "critical", "タイトル未入力"));
    out.push(item("title-structure", "タイトル構造", "critical", "タイトル未入力"));
  } else {
    const n = title.counts.total;
    st = n === 0 ? "critical" : n < 10 || n > 100 ? "warning" : n > 80 ? "info" : "pass";
    out.push(item("title-length", "タイトル長", st, `${n} 文字（目安: 20〜60文字）`));

    const crit = title.overuseIssues.filter((i) => i.severity === "critical");
    const warn = title.overuseIssues.filter((i) => i.severity === "warning");
    st = crit.length > 0 ? "critical" : warn.length > 0 ? "warning" : "pass";
    out.push(item("title-structure", "タイトル構造", st, crit.length > 0 || warn.length > 0
      ? [...crit, ...warn].map((i) => i.label).join(" / ")
      : "構造は良好"));
  }

  // Title duplication with thumbnail
  const rel = ctx.relation;
  st = "pass";
  if (!rel) st = "unset";
  else if (!rel.hasTitle) st = "unset";
  else if (!rel.hasThumbnailText) st = "info";
  else if (rel.duplicateRole) st = "critical";
  else if (rel.overlapRatio >= 0.5) st = "warning";
  else st = "pass";
  const relDetail = rel
    ? rel.duplicateRole
      ? `重複率 ${(rel.overlapRatio * 100).toFixed(0)}% で役割が重複`
      : rel.exactMatches.length === 0
        ? "一致語なし"
        : `一致語: ${rel.exactMatches.join(", ")}`
    : "未評価";
  out.push(item("title-duplication", "タイトル重複", st, relDetail));

  // Description
  const desc = ctx.description;
  if (!desc || desc.length === 0) {
    out.push(item("description", "概要欄", "info", "未設定（記載を推奨）"));
  } else {
    const crit = desc.warnings.filter((w) => w.severity === "critical");
    const warn = desc.warnings.filter((w) => w.severity === "warning");
    st = crit.length > 0 ? "critical" : warn.length > 0 ? "warning" : "pass";
    out.push(item("description", "概要欄", st, `${desc.length} 文字 / ${desc.lineCount} 行`));
  }

  // URL
  if (!desc || desc.urlCount === 0) {
    out.push(item("url", "URL", "info", "URL なし"));
  } else {
    const invalid = desc.urls.filter((u) => u.normalized === "").length;
    const http = desc.urls.filter((u) => u.raw.toLowerCase().startsWith("http:") || /^www\./i.test(u.raw)).length;
    st = invalid > 0 ? "critical" : desc.nonHttpsCount > 0 ? "warning" : "pass";
    out.push(item("url", "URL", st, `${desc.urlCount} 件 / HTTPS でない: ${http} 件`));
  }

  // Hashtag
  const htags = ctx.hashtags;
  if (!htags || htags.count === 0) {
    out.push(item("hashtag", "ハッシュタグ", "info", "未設定（任意）"));
  } else {
    const crit = htags.warnings.some((w) => w.severity === "critical");
    const warn = htags.warnings.some((w) => w.severity === "warning");
    st = crit ? "critical" : warn ? "warning" : "pass";
    out.push(item("hashtag", "ハッシュタグ", st, `登録 ${htags.count} 個（重複 ${htags.duplicates.length} 件）`));
  }

  // Chapters
  const ch = ctx.chapters;
  if (!ch || ch.chapters.length === 0) {
    out.push(item("chapter", "チャプター", "info", "未設定（設定を推奨）"));
  } else {
    const crit = ch.invalidLines.length > 0 || !ch.isAscending || ch.exceedsDuration;
    const warn = !ch.startsAtZero || ch.missingTitles > 0 || ch.hasDuplicates;
    const infoN = ch.tooShortGap;
    st = crit ? "critical" : warn ? "warning" : infoN ? "info" : "pass";
    const cDetail = `${ch.chapters.length} 件 / 不正行 ${ch.invalidLines.length} / 尺超 ${ch.exceedsDuration ? "あり" : "なし"}`;
    out.push(item("chapter", "チャプター", st, cDetail));
  }

  // Duration
  const dur = ctx.duration;
  st = dur.valid ? "pass" : "warning";
  out.push(item("duration", "動画尺", st, dur.valid ? "形式OK" : dur.raw.trim() ? "形式NG" : "未入力"));

  // Genre
  const genre = ctx.genre;
  if (!genre) {
    out.push(item("genre", "ジャンル", "unset", "未選択（任意）"));
  } else {
    const hit = findGenreKeyword(genre, [ctx.titleText, ctx.descriptionText]);
    out.push(
      item(
        "genre",
        "ジャンル",
        hit ? "pass" : "info",
        hit
          ? `ジャンル: ${genre}（タイトル・概要欄に「${hit}」が見つかりました）`
          : `ジャンル: ${genre}（タイトル・概要欄にジャンルの語があると検索に寄与します）`
      )
    );
  }

  // Technical
  const techProblems: ChecklistStatus[] = [];
  if (!hasThumb) techProblems.push("critical");
  if (dur && !dur.valid) techProblems.push("info");
  if (ch && ch.exceedsDuration) techProblems.push("critical");
  st = techProblems.includes("critical") ? "critical" : techProblems.includes("info") ? "info" : "pass";
  out.push(item("technical", "技術チェック", st, techProblems.length === 0 ? "問題なし" : "設定漏れあり"));

  return out;
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export function summarize(checklist: ChecklistItem[]): DiagnosisSummary {
  const summary: DiagnosisSummary = { critical: 0, warning: 0, info: 0, pass: 0, unset: 0 };
  for (const c of checklist) {
    if (isBad(c.status)) {
      if (c.status === "critical") summary.critical++;
      else summary.warning++;
    } else if (c.status === "info") summary.info++;
    else if (c.status === "unset") summary.unset++;
    else summary.pass++;
  }
  return summary;
}

export function allPass(result: DiagnosisResult): boolean {
  return result.summary.critical === 0 && result.summary.warning === 0;
}

export function severityRank(s: Severity): number {
  switch (s) {
    case "critical": return 0;
    case "warning": return 1;
    case "info": return 2;
    case "good": return 3;
  }
}