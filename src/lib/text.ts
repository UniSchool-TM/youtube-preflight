const HIRAGANA_RE = /[\u3040-\u309f]/;
const KATAKANA_RE = /[\u30a0-\u30ff\u31f0-\u31ff]/;
const KANJI_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const CJK_PUNCT = /[\u3000\u3001\u3002\u3008-\u3011\u3014-\u301f\uff01-\uff0f\uff1a-\uff1f\uff3b\uff3d\uff5e\uffe0-\uffee\u2018\u2019\u201c\u201d\u2026\u00b7\u30fb\ufe0f]/;
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{2695}-\u{2699}\u{2705}\u{2764}\u{2E50}-\u{2E51}]/u;
const WHITESPACE_RE = /\s/;
const WORD_CHAR_RE =
  /[\p{L}\p{N}\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\u3400-\u4dbf]/u;

export function isHiragana(ch: string): boolean {
  return HIRAGANA_RE.test(ch);
}
export function isKatakana(ch: string): boolean {
  return KATAKANA_RE.test(ch);
}
export function isKanji(ch: string): boolean {
  return KANJI_RE.test(ch);
}
export function isEmoji(ch: string): boolean {
  return EMOJI_RE.test(ch);
}
export function isCjkPunct(ch: string): boolean {
  return CJK_PUNCT.test(ch);
}
export function isWhitespace(ch: string): boolean {
  return WHITESPACE_RE.test(ch);
}
export function isLetter(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}
export function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}

/** Count graphemes/code points. Code points are enough for our rule-based checks. */
export function countCodePoints(text: string): number {
  return Array.from(text).length;
}

/**
 * Character class of a single code point:
 * kanji | hiragana | katakana | letter | digit | emoji | cjkPunct | symbol | whitespace | other
 */
export function charClass(ch: string): string {
  if (isKanji(ch)) return "kanji";
  if (isHiragana(ch)) return "hiragana";
  if (isKatakana(ch)) return "katakana";
  if (isEmoji(ch)) return "emoji";
  if (isLetter(ch)) return "letter";
  if (isDigit(ch)) return "digit";
  if (isCjkPunct(ch)) return "cjkPunct";
  if (isWhitespace(ch)) return "whitespace";
  return "symbol";
}

export function isWordChar(ch: string): boolean {
  return WORD_CHAR_RE.test(ch);
}

/** Extract all numbers (sequence of digits) from text. */
export function extractNumbers(text: string): string[] {
  const matches = text.match(/[0-9０-９]+/g);
  return matches ? matches.map((m) => m.replace(/[０-９]/g, (d) => String("０１２３４５６７８９".indexOf(d)))) : [];
}

/** Extract all URLs from text. */
export function extractUrls(text: string): string[] {
  const urlRe =
    /(?:https?:\/\/)[^\s<>"'\u3000]+|(?:www\.)[^\s<>"'\u3000]+/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(urlRe.source, "gi");
  while ((m = re.exec(text)) !== null) {
    out.push(m[0]);
  }
  return out;
}

/** Basic word tokenization mixing CJK-class boundaries + separators. */
export function tokenizeWords(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let prevClass = "";
  for (const ch of Array.from(text)) {
    const cls = charClass(ch);
    const isWordy = ["kanji", "hiragana", "katakana", "letter", "digit"].includes(cls);
    if (isWordy) {
      const boundary =
        prevClass !== "" &&
        ((prevClass === "hiragana" && (cls === "kanji" || cls === "katakana")) ||
          ((prevClass === "kanji" || prevClass === "katakana" || prevClass === "letter" || prevClass === "digit") &&
            cls === "hiragana") ||
          (prevClass !== cls && prevClass !== "hiragana" && cls !== "hiragana"));
      if (boundary && current) {
        tokens.push(current);
        current = "";
      }
      current += ch;
    } else {
      if (current) {
        tokens.push(current);
        current = "";
      }
      if (!isWhitespace(ch) && cls === "symbol") {
        tokens.push(ch);
      }
    }
    prevClass = cls;
  }
  if (current) tokens.push(current);
  return tokens.filter((t) => t.length > 0);
}

/** Convert full-width digits/latin to ASCII for normalization. */
export function normalizeAscii(text: string): string {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .toLowerCase()
    .replace(/[\u3000\s]+/g, " ")
    .trim();
}