import { describe, expect, it } from "vitest";
import { analyzeTitle, countCharacters, exactWords } from "@/lib/title";
import { charClass } from "@/lib/text";

describe("countCharacters", () => {
  it("counts by character class using code points", () => {
    const c = countCharacters("Hello 世界!あ");
    expect(c.total).toBe(10); // H,e,l,l,o,space,世,界,!,あ
    expect(c.letters).toBe(5);
    expect(c.whitespace).toBe(1);
    expect(c.kanji).toBe(2);
    expect(c.symbols).toBe(1);
    expect(c.japanese).toBe(3);
  });

  it("counts emoji and digits", () => {
    const c = countCharacters("2024年🎉");
    expect(c.digits).toBe(4);
    expect(c.emoji).toBe(1);
    expect(c.total).toBe(6);
  });
});

describe("analyzeTitle", () => {
  it("produces a stable, non-empty analysis", () => {
    const a = analyzeTitle("【徹底比較】動画編集ソフトを1年間使った結果");
    expect(a.raw).toContain("動画編集");
    expect(a.counts.total).toBeGreaterThan(10);
    expect(a.structure.squareBrackets).toBe(true);
    expect(a.structure.hasDigits).toBe(true);
    expect(a.tokens.length).toBeGreaterThan(3);
    expect(a.frontInfoRatio).toBeGreaterThanOrEqual(0);
    expect(a.frontInfoRatio).toBeLessThanOrEqual(1);
  });

  it("flags repeated punctuation with importance-aware clues", () => {
    const a = analyzeTitle("これ最強です！！！これ最強です？？？");
    expect(
      a.overuseIssues.some((i) => i.key === "excess-exclamation")
    ).toBe(true);
    expect(
      a.overuseIssues.some((i) => i.key === "excess-question")
    ).toBe(true);
  });

  it("flags a >100 char title as critical too-long", () => {
    const long = "動画編集".repeat(30); // 120 chars
    const a = analyzeTitle(long);
    const issue = a.overuseIssues.find((i) => i.key === "too-long");
    expect(issue?.severity).toBe("critical");
  });

  it("flags empty title as critical empty", () => {
    const a = analyzeTitle("");
    expect(a.counts.total).toBe(0);
    expect(a.overuseIssues.some((i) => i.key === "empty" && i.severity === "critical")).toBe(true);
    expect(a.tokens.length).toBe(0);
    expect(a.frontInfoRatio).toBe(0);
  });

  it("flags very short titles as too-short", () => {
    const a = analyzeTitle("あ");
    expect(a.overuseIssues.some((i) => i.key === "too-short")).toBe(true);
  });

  it("detects repeated sequences", () => {
    const a = analyzeTitle("ぜんぜんぜん　やばいやばい");
    expect(a.structure.repeatedSequences.length).toBeGreaterThan(0);
  });

  it("marks digit/number words as important tokens", () => {
    const a = analyzeTitle("2024年版 初心者向け 動画編集ソフト比較");
    const digitTok = a.tokens.find((t) => /2024/.test(t.text));
    expect(digitTok).toBeDefined();
    expect(digitTok!.importance).toBeGreaterThanOrEqual(2);
  });

  it("tokens have valid positions within the word-stream", () => {
    const a = analyzeTitle("【比較】動画編集ソフト1年使った結果");
    const wordChars = Array.from(a.raw).filter((ch) =>
      ["kanji", "hiragana", "katakana", "letter", "digit"].includes(charClass(ch))
    );
    for (const t of a.tokens) {
      expect(t.start).toBeGreaterThanOrEqual(0);
      expect(t.end).toBeGreaterThan(t.start);
      expect(t.end).toBeLessThanOrEqual(wordChars.length);
      expect(t.text).toBe(wordChars.slice(t.start, t.end).join(""));
    }
  });
});

describe("exactWords", () => {
  it("tokenizes mixed text", () => {
    const words = exactWords("動画編集 1年 のあれこれ");
    expect(words).toContain("動画編集");
    expect(words).toContain("1");
  });
});