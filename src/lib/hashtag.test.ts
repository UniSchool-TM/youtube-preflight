import { describe, expect, it } from "vitest";
import { analyzeHashtags, extractHashtagsFromRaw } from "@/lib/hashtag";

describe("extractHashtagsFromRaw", () => {
  it("splits by whitespace and commas", () => {
    expect(extractHashtagsFromRaw("動画編集 編集, #解説,YouTube")).toEqual([
      "動画編集",
      "編集",
      "解説",
      "YouTube",
    ]);
  });

  it("strips leading #s", () => {
    expect(extractHashtagsFromRaw("##hogehoge #fuga")).toEqual(["hogehoge", "fuga"]);
  });
});

describe("analyzeHashtags", () => {
  it("counts tags and unique count", () => {
    const h = analyzeHashtags("動画編集 編集 #解説 YouTube");
    expect(h.count).toBe(4);
    expect(h.uniqueCount).toBe(4);
  });

  it("detects duplicates case-insensitively", () => {
    const h = analyzeHashtags("abc ABC abc");
    expect(h.count).toBe(3);
    expect(h.uniqueCount).toBe(1);
    expect(h.duplicates).toContain("abc");
    expect(h.duplicates).toContain("ABC");
    expect(h.warnings.some((w) => w.label === "重複")).toBe(true);
  });

  it("detects language and character types", () => {
    const h = analyzeHashtags("編集 222 abc");
    const jp = h.tags.find((t) => t.tag === "編集")!;
    expect(jp.hasJapanese).toBe(true);
    expect(jp.hasDigits).toBe(false);
    const en = h.tags.find((t) => t.tag === "abc")!;
    expect(en.hasEnglish).toBe(true);
    const dg = h.tags.find((t) => t.tag === "222")!;
    expect(dg.hasDigits).toBe(true);
  });

  it("flags special characters", () => {
    const h = analyzeHashtags("あい❤️");
    const tag = h.tags[0];
    expect(tag.hasSpecial).toBe(true);
    expect(h.warnings.some((w) => w.label === "特殊文字")).toBe(true);
  });

  it("flags overly long tags", () => {
    const long = "a".repeat(70);
    const h = analyzeHashtags(long);
    expect(h.maxLength).toBe(70);
    expect(h.warnings.some((w) => w.label === "長さ")).toBe(true);
  });

  it("handles empty input", () => {
    const h = analyzeHashtags("");
    expect(h.count).toBe(0);
    expect(h.tags).toHaveLength(0);
  });
});