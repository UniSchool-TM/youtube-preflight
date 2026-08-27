import type { HashtagAnalysis, HashtagItem } from "@/types";
import {
  countCodePoints,
  isDigit,
  isHiragana,
  isKatakana,
  isKanji,
  isLetter,
} from "@/lib/text";

function isSpecialChar(ch: string): boolean {
  return !isDigit(ch) && !isLetter(ch) && !isHiragana(ch) && !isKatakana(ch) && !isKanji(ch) && ch !== "_" && ch !== "ー" && ch !== "・";
}

export function extractHashtagsFromRaw(raw: string): string[] {
  return raw
    .split(/[\s,、\n]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter((t) => t.length > 0);
}

export function analyzeHashtags(raw: string): HashtagAnalysis {
  const tags = extractHashtagsFromRaw(raw).map((t): HashtagItem => {
    const chars = Array.from(t);
    const hasJapanese = chars.some((c) => isHiragana(c) || isKatakana(c) || isKanji(c));
    const hasEnglish = chars.some((c) => isLetter(c));
    const hasDigits = chars.some((c) => isDigit(c));
    const hasSpecial = chars.some(isSpecialChar);
    return { tag: t, length: countCodePoints(t), hasJapanese, hasEnglish, hasDigits, hasSpecial };
  });

  const seen = new Set<string>();
  const dups: string[] = [];
  for (const t of tags) {
    const key = t.tag.toLowerCase();
    if (seen.has(key)) {
      if (!dups.includes(t.tag)) dups.push(t.tag);
    } else {
      seen.add(key);
    }
  }

  const count = tags.length;
  const uniqueCount = count - dups.length;
  const totalChars = tags.reduce((a, t) => a + t.length, 0);
  const maxLength = tags.reduce((a, t) => Math.max(a, t.length), 0);

  const warnings: HashtagAnalysis["warnings"] = [];
  if (count > 15) {
    warnings.push({
      label: "個数",
      severity: "warning",
      detail: `ハッシュタグが ${count} 個あります。多すぎると読みづらく、YouTube は最初の3つしかタイトル上に表示しません`,
    });
  }
  if (dups.length > 0) {
    warnings.push({ label: "重複", severity: "warning", detail: `重複したハッシュタグ: ${dups.join(", ")}` });
  }
  if (count > 0 && maxLength > 60) {
    warnings.push({ label: "長さ", severity: "info", detail: `最長のハッシュタグが ${maxLength} 文字あります。短く区切ると読みやすいです` });
  }
  const special = tags.filter((t) => t.hasSpecial);
  if (special.length > 0) {
    warnings.push({
      label: "特殊文字",
      severity: "info",
      detail: `英数字・日本語以外の文字を含むタグ: ${special.map((t) => `#${t.tag}`).join(", ")}`,
    });
  }

  return { tags, count, duplicates: dups, uniqueCount, totalChars, maxLength, warnings };
}