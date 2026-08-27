import type { TitleThumbnailRelation } from "@/types";
import { extractNumbers, normalizeAscii, tokenizeWords } from "@/lib/text";

/** Split thumbnail text into words (shared tokenizer). */
export function thumbnailWords(text: string): string[] {
  return tokenizeWords(text);
}

export function analyzeTitleThumbnail(title: string, thumbnailText: string): TitleThumbnailRelation {
  const hasTitle = title.trim().length > 0;
  const hasThumbnailText = thumbnailText.trim().length > 0;
  const messages: TitleThumbnailRelation["messages"] = [];

  if (!hasTitle) {
    messages.push({ type: "critical", text: "タイトルが未入力のため、タイトルとサムネイルの関係を分析できません" });
  }
  if (!hasThumbnailText) {
    messages.push({ type: "info", text: "「サムネイル文字」が未入力です（任意）。入力するとタイトルとの重複をチェックできます" });
  }

  const titleTokens = hasTitle ? tokenizeWords(title).map(normalizeAscii) : [];
  const thumbTokens = hasThumbnailText ? tokenizeWords(thumbnailText).map(normalizeAscii) : [];

  const titleSet = new Set(titleTokens.filter((w) => w.length >= 2));
  const matches: string[] = [];
  for (const wt of thumbTokens) {
    if (wt.length >= 2 && titleSet.has(wt)) {
      if (!matches.includes(wt)) matches.push(wt);
    }
  }

  const thumbCharTotal = Array.from(thumbnailText).length;
  const matchedChars = matches.reduce((a, w) => a + w.length, 0);
  let overlapRatio = 0;
  if (thumbCharTotal > 0) {
    const maxPossible = Math.max(1, Math.min(Array.from(title).length, thumbCharTotal));
    overlapRatio = Math.min(1, matchedChars / maxPossible);
  }

  const titleNums = new Set(extractNumbers(title));
  const thumbNums = new Set(extractNumbers(thumbnailText));
  const digitMatches: string[] = [];
  for (const n of thumbNums) {
    if (titleNums.has(n)) digitMatches.push(n);
  }

  const duplicateRole = hasTitle && hasThumbnailText && overlapRatio >= 0.6;
  if (duplicateRole) {
    messages.push({
      type: "warning",
      text: "タイトルとサムネイル文字の役割が重複している可能性があります（同じ情報が両方に含まれています）",
    });
  } else if (hasTitle && hasThumbnailText) {
    if (overlapRatio > 0.3) {
      messages.push({ type: "info", text: "タイトルとサムネイルに一部共通の語があります。補完関係はある程度保たれています" });
    } else {
      messages.push({ type: "good", text: "タイトルとサムネイル文字は概ね補完関係にあります（重複が少ない）" });
    }
  }

  return {
    hasTitle,
    hasThumbnailText,
    thumbnailTextWords: tokenizeWords(thumbnailText),
    exactMatches: matches,
    overlapRatio,
    digitMatches,
    duplicateRole,
    messages,
  };
}