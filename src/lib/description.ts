import type { DescriptionAnalysis, UrlInfo } from "@/types";
import { countCodePoints, isEmoji, extractUrls } from "@/lib/text";

const HASHTAG_RE = /(?:^|\s)#([\p{L}\p{N}_ー・]+)/gu;
const MENTION_RE = /(?:^|\s)@([\p{L}\p{N}_]+)/gu;

export function extractHashtags(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(HASHTAG_RE.source, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
  }
  return out;
}

export function parseUrl(raw: string): UrlInfo | null {
  const r = raw.trim();
  let normalized = r;
  if (/^www\./i.test(r)) normalized = `http://${r}`;
  try {
    const u = new URL(normalized);
    return {
      raw,
      scheme: u.protocol.replace(":", "").toLowerCase(),
      host: u.hostname.toLowerCase(),
      isHttps: u.protocol === "https:",
      normalized: u.href,
    };
  } catch {
    return { raw, scheme: "", host: "", isHttps: false, normalized: "" };
  }
}

export function analyzeDescription(text: string): DescriptionAnalysis {
  const chars = Array.from(text);
  const length = chars.length;
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;

  const urls = extractUrls(text)
    .map(parseUrl)
    .filter((u): u is UrlInfo => u !== null);
  const urlCount = urls.length;

  const hashtagMatches = text.match(HASHTAG_RE) ?? [];
  const hashtagCount = hashtagMatches.length;
  const mentionMatches = text.match(MENTION_RE) ?? [];
  const mentionCount = mentionMatches.length;

  const emptyLineCount = lines.filter((l) => l.trim() === "").length;
  let maxConsecutiveEmptyLines = 0;
  let run = 0;
  for (const l of lines) {
    if (l.trim() === "") {
      run++;
      maxConsecutiveEmptyLines = Math.max(maxConsecutiveEmptyLines, run);
    } else {
      run = 0;
    }
  }

  const emojiCount = chars.filter(isEmoji).length;

  let firstLineLength = 0;
  const lineWidths: number[] = [];
  let firstNonEmpty = true;
  for (const l of lines) {
    if (l.trim() === "" && firstNonEmpty) continue;
    if (firstNonEmpty) {
      firstLineLength = countCodePoints(l.trim());
      firstNonEmpty = false;
    }
    lineWidths.push(countCodePoints(l));
  }

  const trailingWhitespace = /\s+$/.test(text.replace(/\n+$/, "")) || text !== text.replace(/\s+$/, "");
  const unnaturalWhitespace = /[\t]/.test(text) || / {2,}/.test(text);

  const seen = new Map<string, string>();
  const duplicateUrls: string[] = [];
  for (const u of urls) {
    if (u.normalized) {
      const s = seen.get(u.normalized);
      if (s !== undefined) {
        if (!duplicateUrls.includes(u.normalized)) duplicateUrls.push(u.normalized);
      } else {
        seen.set(u.normalized, u.raw);
      }
    }
  }
  const nonHttpsCount = urls.filter((u) => !u.isHttps).length;
  const hashtagDensity = length === 0 ? 0 : hashtagCount / (length / 100);

  const warnings: DescriptionAnalysis["warnings"] = [];
  if (length === 0) {
    warnings.push({ label: "概要欄", severity: "info", detail: "概要欄が空です。記入を推奨します" });
  }
  if (firstLineLength > 100) {
    warnings.push({
      label: "冒頭文",
      severity: "warning",
      detail: `冒頭文が ${firstLineLength} 文字あります（検索・共有時に表示される最初の約100文字に重要情報を入れると効果的です）`,
    });
  }
  if (urlCount >= 8) {
    warnings.push({ label: "URL数", severity: "warning", detail: `URL が ${urlCount} 個あります。多すぎると読みづらくなることがあります` });
  }
  if (hashtagCount > 15) {
    warnings.push({ label: "ハッシュタグ数", severity: "warning", detail: `ハッシュタグが ${hashtagCount} 個あります。YouTube は最初の3つだけをタイトル上に表示します` });
  }
  if (nonHttpsCount > 0) {
    warnings.push({ label: "URL", severity: "warning", detail: `HTTPS ではない URL が ${nonHttpsCount} 個あります` });
  }
  if (duplicateUrls.length > 0) {
    warnings.push({ label: "重複URL", severity: "info", detail: `重複した URL が ${duplicateUrls.length} 件あります` });
  }
  if (maxConsecutiveEmptyLines >= 3) {
    warnings.push({ label: "空行", severity: "info", detail: `空行が ${maxConsecutiveEmptyLines} 行連続しています` });
  }
  if (unnaturalWhitespace) {
    warnings.push({ label: "空白", severity: "info", detail: "タブや連続する半角空白が含まれています" });
  }

  return {
    length,
    lineCount,
    urlCount,
    hashtagCount,
    mentionCount,
    emptyLineCount,
    maxConsecutiveEmptyLines,
    emojiCount,
    firstLineLength,
    lineWidths,
    trailingWhitespace,
    unnaturalWhitespace,
    urls,
    duplicateUrls,
    nonHttpsCount,
    hashtagDensity,
    warnings,
  };
}