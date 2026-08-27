import type { Chapter, ChapterAnalysis } from "@/types";
import { parseDuration } from "@/lib/duration";

const CHAPTER_RE = /^\s*(\d{1,3}):([0-5]?\d)(?::([0-5]?\d))?\s+(.+?)\s*$/;
const TIME_ONLY_RE = /^\s*(\d{1,3}):([0-5]?\d)(?::([0-5]?\d))?\s*$/;

export function parseChapterLineRaw(raw: string): {
  timeSeconds: number | null;
  timeLabel: string | null;
  title: string;
} {
  const trimmed = raw.trim();
  const m = CHAPTER_RE.exec(trimmed);
  if (m) {
    const third = m[3] !== undefined ? parseInt(m[3], 10) : null;
    const hours = third !== null ? parseInt(m[1], 10) : 0;
    const minutes = third !== null ? parseInt(m[2], 10) : parseInt(m[1], 10);
    const seconds = third !== null ? third : parseInt(m[2], 10);
    const timeSeconds = hours * 3600 + minutes * 60 + seconds;
    const timeLabel = `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const title = m[4].trim();
    return { timeSeconds, timeLabel, title };
  }
  if (TIME_ONLY_RE.test(trimmed)) {
    const dm = TIME_ONLY_RE.exec(trimmed)!;
    const third = dm[3] !== undefined ? parseInt(dm[3], 10) : null;
    const hours = third !== null ? parseInt(dm[1], 10) : 0;
    const minutes = third !== null ? parseInt(dm[2], 10) : parseInt(dm[1], 10);
    const seconds = third !== null ? third : parseInt(dm[2], 10);
    return { timeSeconds: hours * 3600 + minutes * 60 + seconds, timeLabel: trimmed, title: "" };
  }
  return { timeSeconds: null, timeLabel: null, title: trimmed };
}

export function analyzeChapters(raw: string, durationSeconds: number | null): ChapterAnalysis {
  const lines = raw.split(/\r?\n/);
  const chapters: Chapter[] = [];
  const invalidLines: string[] = [];
  const warnings: ChapterAnalysis["warnings"] = [];

  for (const line of lines) {
    if (line.trim() === "") continue;
    const parsed = parseChapterLineRaw(line);
    if (parsed.timeSeconds === null) {
      invalidLines.push(line.trim());
    } else {
      chapters.push({
        timeSeconds: parsed.timeSeconds,
        timeLabel: parsed.timeLabel!,
        title: parsed.title,
        raw: line.trim(),
      });
    }
  }

  const startsAtZero = chapters.length > 0 && chapters[0].timeSeconds === 0;
  let isAscending = true;
  const dupTimes = new Set<string>();
  const duplicateTimes: string[] = [];
  if (chapters.length > 0) dupTimes.add(chapters[0].timeLabel);
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].timeSeconds < chapters[i - 1].timeSeconds) {
      isAscending = false;
    }
    const t = chapters[i].timeSeconds;
    if (t !== null) {
      const key = chapters[i].timeLabel;
      if (dupTimes.has(key)) {
        if (!duplicateTimes.includes(key)) duplicateTimes.push(key);
      } else {
        dupTimes.add(key);
      }
    }
  }
  const hasDuplicates = duplicateTimes.length > 0;
  const missingTitles = chapters.filter((c) => c.title.trim() === "").length;

  let exceedsDuration = false;
  if (durationSeconds !== null) {
    exceedsDuration = chapters.some((c) => c.timeSeconds > durationSeconds);
  }

  let minGap: number | null = null;
  for (let i = 1; i < chapters.length; i++) {
    const gap = chapters[i].timeSeconds - chapters[i - 1].timeSeconds;
    if (minGap === null || gap < minGap) minGap = gap;
  }

  if (!startsAtZero && chapters.length > 0) {
    warnings.push({
      label: "チャプター先頭",
      severity: "warning",
      detail: "最初のチャプターは 00:00 で始まるのが標準です（0:00 も可）",
    });
  }
  if (!isAscending) {
    warnings.push({ label: "時刻順序", severity: "critical", detail: "チャプター時刻が昇順になっていません" });
  }
  if (hasDuplicates) {
    warnings.push({
      label: "重複時刻",
      severity: "warning",
      detail: `重複した時刻があります: ${duplicateTimes.join(", ")}`,
    });
  }
  if (exceedsDuration && durationSeconds !== null) {
    warnings.push({
      label: "動画尺超過",
      severity: "critical",
      detail: `動画尺（${formatDur(durationSeconds)}）を超えるチャプターがあります`,
    });
  }
  if (missingTitles > 0) {
    warnings.push({
      label: "タイトルなし",
      severity: "warning",
      detail: `タイトルのないチャプターが ${missingTitles} 件あります`,
    });
  }
  if (minGap !== null && minGap < 10) {
    warnings.push({
      label: "間隔",
      severity: "info",
      detail: `最短のチャプター間隔が ${minGap} 秒です。YouTube のチャプター機能が正しく表示されるには 10 秒以上が求められます`,
    });
  }
  if (chapters.length > 0 && chapters.length < 3) {
    warnings.push({
      label: "チャプター数",
      severity: "info",
      detail: "チャプターは 3 つ以上あると YouTube 側で活用されやすくなります",
    });
  }
  if (chapters.length > 200) {
    warnings.push({ label: "チャプター数", severity: "warning", detail: "チャプターが 200 を超えています" });
  }

  return {
    chapters,
    totalCount: chapters.length,
    invalidLines,
    startsAtZero,
    isAscending,
    hasDuplicates,
    duplicateTimes,
    exceedsDuration,
    missingTitles,
    minGap,
    tooShortGap: minGap !== null && minGap < 10,
    warnings,
  };
}

function formatDur(total: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(total / 3600);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

export function parseDurationForChapter(raw: string): number | null {
  return parseDuration(raw).seconds;
}