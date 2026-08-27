import { describe, expect, it } from "vitest";
import { analyzeTitleThumbnail, thumbnailWords } from "@/lib/titleThumbnail";

describe("analyzeTitleThumbnail", () => {
  it("finds overlapping words and digits", () => {
    const r = analyzeTitleThumbnail("動画編集のコツ5選", "コツ 5選");
    expect(r.hasTitle).toBe(true);
    expect(r.hasThumbnailText).toBe(true);
    expect(r.exactMatches).toContain("コツ");
    expect(r.digitMatches).toContain("5");
    expect(r.overlapRatio).toBeGreaterThan(0);
  });

  it("reports no common words as complementary", () => {
    const r = analyzeTitleThumbnail("動画編集の基本を解説", "今すぐチェック");
    expect(r.exactMatches).toHaveLength(0);
    expect(r.duplicateRole).toBe(false);
    expect(r.messages.some((m) => m.type === "good")).toBe(true);
  });

  it("flags heavy duplication as duplicate role", () => {
    const r = analyzeTitleThumbnail(
      "1年間動画編集を続けた結果がこちら 収益公開",
      "1年間動画編集 収益公開"
    );
    expect(r.duplicateRole).toBe(true);
    expect(r.messages.some((m) => m.text.includes("役割が重複"))).toBe(true);
  });

  it("handles missing thumbnail text", () => {
    const r = analyzeTitleThumbnail("動画編集のコツ", "");
    expect(r.hasThumbnailText).toBe(false);
    expect(r.exactMatches).toHaveLength(0);
    expect(r.messages.some((m) => m.type === "info")).toBe(true);
  });

  it("handles missing title", () => {
    const r = analyzeTitleThumbnail("", "コツ");
    expect(r.hasTitle).toBe(false);
    expect(r.messages.some((m) => m.type === "critical")).toBe(true);
  });
});

describe("thumbnailWords", () => {
  it("splits thumb text into words", () => {
    expect(thumbnailWords("コツ 5選！")).toContain("コツ");
  });
});