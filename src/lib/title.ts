import type {
  Severity,
  TitleAnalysis,
  TitleCharacterCounts,
  TitleOveruseIssue,
  TitleToken,
} from "@/types";
import {
  charClass,
  countCodePoints,
  extractNumbers,
  isDigit,
  isHiragana,
  isKanji,
  isKatakana,
  tokenizeWords,
} from "@/lib/text";

interface CharCounts {
  kanji: number;
  hiragana: number;
  katakana: number;
  letters: number;
  digits: number;
  emoji: number;
  symbols: number;
  whitespace: number;
  cjkPunct: number;
  other: number;
}

export function countCharacters(text: string): TitleCharacterCounts {
  const c: CharCounts = {
    kanji: 0,
    hiragana: 0,
    katakana: 0,
    letters: 0,
    digits: 0,
    emoji: 0,
    symbols: 0,
    whitespace: 0,
    cjkPunct: 0,
    other: 0,
  };
  for (const ch of Array.from(text)) {
    switch (charClass(ch)) {
      case "kanji": c.kanji++; break;
      case "hiragana": c.hiragana++; break;
      case "katakana": c.katakana++; break;
      case "letter": c.letters++; break;
      case "digit": c.digits++; break;
      case "emoji": c.emoji++; break;
      case "cjkPunct": c.cjkPunct++; break;
      case "whitespace": c.whitespace++; break;
      default: c.other++; break;
    }
  }
  const total = countCodePoints(text);
  return {
    total,
    japanese: c.kanji + c.hiragana + c.katakana,
    kanji: c.kanji,
    hiragana: c.hiragana,
    katakana: c.katakana,
    alnum: c.letters + c.digits,
    digits: c.digits,
    letters: c.letters,
    symbols: c.symbols + c.cjkPunct + c.other,
    emoji: c.emoji,
    whitespace: c.whitespace,
  };
}

export function isJapaneseSentenceParticle(word: string): boolean {
  const chars = Array.from(word);
  const allKana = chars.every((ch) => isHiragana(ch) || isKatakana(ch));
  return allKana && chars.length <= 2;
}

function tokenImportance(word: string, index: number, total: number): { importance: number; reason: string[] } {
  const reason: string[] = [];
  let imp = 0;
  const hasDigit = Array.from(word).some(isDigit);
  if (hasDigit) {
    imp += 2;
    reason.push("数字を含む");
  }
  const katakanaCount = Array.from(word).filter(isKatakana).length;
  if (katakanaCount >= 2) {
    imp += 2;
    reason.push("カタカナ語");
  }
  const kanjiCount = Array.from(word).filter(isKanji).length;
  if (kanjiCount >= 1) {
    imp += 1;
    const len = countCodePoints(word);
    if (kanjiCount >= 2 && len >= 3) {
      imp += 1;
      reason.push("漢字の固有名詞らしさ");
    }
    if (reason.length === 0) reason.push("漢字を含む");
  }
  if (/^[A-Za-z]{2,}$/.test(word) && word === word.toUpperCase()) {
    imp += 2;
    reason.push("大文字の英単語");
  }
  if (isJapaneseSentenceParticle(word)) {
    imp -= 1;
    reason.push("助詞・短い仮名");
  }
  if (index === 0) {
    imp += 1;
    reason.push("冒頭の語");
  }
  if (total - index <= 1) {
    imp += 1;
    reason.push("末尾の語");
  }
  return { importance: Math.max(0, imp), reason };
}

/** Detect structure flags and repeated characters. */
function detectStructure(text: string) {
  return {
    squareBrackets: /【|】/.test(text),
    cornerBrackets: /「|」/.test(text),
    parens: /（|）|\(|\)/.test(text),
    exclamation: /！|!/.test(text),
    question: /？|\?/.test(text),
    colon: /：|:/.test(text),
    hasDigits: extractNumbers(text).length > 0,
    isQuestionForm: /[？?]\s*$/.test(text) || /(?:何|なに|どう|なぜ|どこ|いつ|誰|だれ|いくら|いくつ|どのくらい)/.test(text),
    hasExclamationMark: /！|!/.test(text),
    repeatedChar: /(.)\1{2,}/.test(text),
    repeatedSequences: (text.match(/(.{2,})\1{1,}/g) ?? []).slice(0, 3),
  };
}

function detectOveruse(
  text: string,
  counts: TitleCharacterCounts,
  repeatedWords: { word: string; count: number }[]
): TitleOveruseIssue[] {
  const issues: TitleOveruseIssue[] = [];
  const severity: Severity = "warning";
  const ex = text.match(/[!！]/g) ?? [];
  const qu = text.match(/[?？]/g) ?? [];
  if (ex.length >= 3) issues.push({ key: "excess-exclamation", label: "感嘆符の多用", detail: `! が ${ex.length} 個あります`, severity });
  if (qu.length >= 3) issues.push({ key: "excess-question", label: "疑問符の多用", detail: `? が ${qu.length} 個あります`, severity });
  if (/[!！?？]{2,}/.test(text)) issues.push({ key: "consecutive-symbols", label: "符号の連続", detail: "! や ? が連続しています", severity });
  const repeats = repeatedWords.filter((r) => r.count >= 3);
  if (repeats.length > 0) {
    issues.push({
      key: "repeated-words",
      label: "同じ語の繰り返し",
      detail: `${repeats.map((r) => `「${r.word}」×${r.count}`).join(", ")}`,
      severity,
    });
  }
  if (/\s{2,}|\t|\u3000{2,}/.test(text)) issues.push({ key: "unnatural-space", label: "不自然な空白", detail: "連続する空白やタブが含まれています", severity });
  if (/[!！？?、。・…]{3,}/.test(text)) issues.push({ key: "unnatural-symbols", label: "不自然な記号", detail: "記号が連続しています", severity });
  if (counts.total > 100) issues.push({ key: "too-long", label: "タイトルが長すぎる", detail: `100 文字を超えています（${counts.total} 文字）`, severity: "critical" });
  if (counts.total >= 1 && counts.total < 6) issues.push({ key: "too-short", label: "タイトルが短すぎる", detail: "6 文字未満です。内容が伝わりにくい可能性があります", severity: "warning" });
  if (counts.total === 0) issues.push({ key: "empty", label: "タイトル未入力", detail: "タイトルが入力されていません", severity: "critical" });
  return issues;
}

export function exactWords(text: string): string[] {
  return tokenizeWords(text);
}

const REPEAT_MIN = 4;

export function analyzeTitle(text: string): TitleAnalysis {
  const counts = countCharacters(text);
  const words = exactWords(text);

  const freq = new Map<string, number>();
  for (const w of words) {
    const key = w.toLowerCase();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const repeatedWords = Array.from(freq.entries())
    .filter(([w, n]) => n >= 2 && w.length >= REPEAT_MIN)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }));

  const overuseIssues = detectOveruse(text, counts, repeatedWords);
  const structure = detectStructure(text);

  // tokenize with positions for front/back importance analysis
  const tokens: TitleToken[] = [];
  const chars = Array.from(text);
  const total = chars.length;
  let pos = 0;
  {
    let i = 0;
    while (i < chars.length) {
      const ch = chars[i];
      const cls = charClass(ch);
      const isWordCharCls = ["kanji", "hiragana", "katakana", "letter", "digit"].includes(cls);
      if (!isWordCharCls) {
        i++;
        continue;
      }
      let j = i + 1;
      while (j < chars.length) {
        const cls2 = charClass(chars[j]);
        const isWordChar2 = ["kanji", "hiragana", "katakana", "letter", "digit"].includes(cls2);
        const boundary =
          (cls === "hiragana" && (cls2 === "kanji" || cls2 === "katakana")) ||
          ((cls === "kanji" || cls === "katakana" || cls === "letter" || cls === "digit") && cls2 === "hiragana") ||
          (cls !== cls2 && cls !== "hiragana" && cls2 !== "hiragana");
        if (!isWordChar2 || boundary) break;
        j++;
      }
      const word = chars.slice(i, j).join("");
      const start = pos;
      const end = start + countCodePoints(word);
      const { importance, reason } = tokenImportance(word, start, total);
      tokens.push({ text: word, start, end, importance, reason });
      if (pos < total) pos = end;
      i = j;
    }
  }

  // Front importance: importance weight within first 40% of visible width vs total.
  const frontCut = Math.max(1, Math.floor(total * 0.4));
  let frontWeight = 0;
  let totalWeight = 0;
  for (const t of tokens) {
    totalWeight += t.importance;
    if (t.start < frontCut) {
      frontWeight += t.importance;
    }
  }
  const frontInfoRatio = totalWeight === 0 ? 0 : frontWeight / totalWeight;
  const frontInfoReason =
    total === 0
      ? "タイトルが未入力のため分析できません"
      : totalWeight === 0
        ? "重要語らしき語（数字・カタカナ・漢字など）が十分に検出できませんでした"
        : tokens[0] && tokens[0].start >= frontCut
          ? "冒頭部分に重要語が少ないようです"
          : frontInfoRatio >= 0.5
            ? "重要語がタイトル前半に配置されています"
            : "重要語は前半と後半に分散しています";

  return {
    raw: text,
    counts,
    tokens,
    structure,
    overuseIssues,
    repeatedWords,
    frontInfoRatio,
    frontInfoReason,
    words,
  };
}