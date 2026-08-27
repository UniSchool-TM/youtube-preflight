import { describe, expect, it } from "vitest";
import {
  analyzeChapters,
  parseChapterLineRaw,
  parseDurationForChapter,
} from "@/lib/chapter";

describe("parseChapterLineRaw", () => {
  it("parses MM:SS + title", () => {
    const r = parseChapterLineRaw("1:30 第一章");
    expect(r.timeSeconds).toBe(90);
    expect(r.timeLabel).toBe("01:30");
    expect(r.title).toBe("第一章");
  });

  it("parses HH:MM:SS + title", () => {
    const r = parseChapterLineRaw("1:02:30 長尺パート");
    expect(r.timeSeconds).toBe(3750);
  });

  it("parses time-only lines with an empty title", () => {
    const r = parseChapterLineRaw("5:30");
    expect(r.timeSeconds).toBe(330);
    expect(r.timeLabel).toBe("5:30");
    expect(r.title).toBe("");
  });

  it("returns null time for lines without a leading time", () => {
    expect(parseChapterLineRaw("オープニングだけ").timeSeconds).toBeNull();
  });
});

describe("analyzeChapters", () => {
  it("accepts a correct chapter list", () => {
    const c = analyzeChapters(
      "00:00 オープニング\n1:30 第一章\n4:32 まとめ",
      300
    );
    expect(c.chapters).toHaveLength(3);
    expect(c.startsAtZero).toBe(true);
    expect(c.isAscending).toBe(true);
    expect(c.hasDuplicates).toBe(false);
    expect(c.exceedsDuration).toBe(false);
    expect(c.missingTitles).toBe(0);
    expect(c.invalidLines).toHaveLength(0);
    expect(c.minGap).toBe(90);
  });

  it("flags missing titles", () => {
    const c = analyzeChapters("00:00\n1:00 第二章", 300);
    expect(c.missingTitles).toBe(1);
    expect(c.warnings.some((w) => w.label === "タイトルなし")).toBe(true);
  });

  it("flags invalid lines", () => {
    const c = analyzeChapters("00:00 開始\nチャプター（時刻なし）", 300);
    expect(c.invalidLines).toEqual(["チャプター（時刻なし）"]);
  });

  it("flags duplicates, non-ascending and out-of-range", () => {
    const c = analyzeChapters("00:00 開始\n2:00 中盤\n1:00 戻り\n5:00 尺超", null);
    expect(c.isAscending).toBe(false);
    expect(c.warnings.some((w) => w.severity === "critical" && w.label === "時刻順序")).toBe(true);

    const dup = analyzeChapters("00:00 A\n00:00 B", 60);
    expect(dup.hasDuplicates).toBe(true);
    expect(dup.duplicateTimes).toContain("00:00");

    const over = analyzeChapters("00:00 A\n20:00 B", 60);
    expect(over.exceedsDuration).toBe(true);
    expect(over.warnings.some((w) => w.label === "動画尺超過")).toBe(true);
  });

  it("flags non-zero start", () => {
    const c = analyzeChapters("0:30 最初がゼロじゃない", 300);
    expect(c.startsAtZero).toBe(false);
    expect(c.warnings.some((w) => w.label === "チャプター先頭")).toBe(true);
  });

  it("flags too-short gaps", () => {
    const c = analyzeChapters("00:00 A\n00:05 B", 300);
    expect(c.minGap).toBe(5);
    expect(c.tooShortGap).toBe(true);
  });

  it("ignores empty lines", () => {
    const c = analyzeChapters("\n00:00 開始\n\n1:00 終わり\n", 300);
    expect(c.chapters).toHaveLength(2);
    expect(c.invalidLines).toHaveLength(0);
  });

  it("returns empty analysis for no input", () => {
    const c = analyzeChapters("", 300);
    expect(c.chapters).toHaveLength(0);
    expect(c.invalidLines).toHaveLength(0);
    expect(c.startsAtZero).toBe(false);
  });
});

describe("parseDurationForChapter", () => {
  it("reuses duration parsing", () => {
    expect(parseDurationForChapter("7:30")).toBe(450);
    expect(parseDurationForChapter("oops")).toBeNull();
  });
});