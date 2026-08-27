import { describe, expect, it } from "vitest";
import type {
  ChapterAnalysis,
  DescriptionAnalysis,
  ThumbnailAnalysis,
} from "@/types";
import {
  scoreChapters,
  scoreDescription,
  scoreHashtags,
  scoreTechnical,
  scoreThumbnail,
  scoreTitle,
  scoreTitleThumbnail,
} from "@/lib/scoring";
import { analyzeChapters } from "@/lib/chapter";
import { analyzeDescription } from "@/lib/description";
import { analyzeHashtags } from "@/lib/hashtag";
import { analyzeTitle } from "@/lib/title";
import { analyzeTitleThumbnail } from "@/lib/titleThumbnail";

function goodThumbnail(): ThumbnailAnalysis {
  return {
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    format: "PNG",
    fileSize: 1 * 1024 * 1024,
    totalPixels: 1920 * 1080,
    avgBrightness: 0.5,
    avgSaturation: 0.4,
    contrast: 0.3,
    edgeAmount: 0.3,
    edgesPerPixel: 0.25,
    dominantColors: [],
    luminanceHistogram: [],
    sampledWidth: 420,
    sampledHeight: 236,
    errors: [],
  };
}

describe("scoreThumbnail", () => {
  it("scores 0/critical for no thumbnail", () => {
    const s = scoreThumbnail(null);
    expect(s.earned).toBe(0);
    expect(s.max).toBe(30);
    expect(s.severity).toBe("critical");
  });

  it("scores full marks for an ideal thumbnail", () => {
    const s = scoreThumbnail(goodThumbnail());
    expect(s.earned).toBe(30);
    expect(s.severity).toBe("good");
  });

  it("reduces marks for low resolution and bad ratio", () => {
    const bad = {
      ...goodThumbnail(),
      width: 320,
      height: 180,
      aspectRatio: 320 / 180,
      fileSize: 12 * 1024 * 1024,
      avgBrightness: 0.01,
      contrast: 0.01,
      avgSaturation: 0.01,
      edgesPerPixel: 0.01,
    };
    const s = scoreThumbnail(bad);
    expect(s.earned).toBeLessThan(15);
    expect(s.severity).toBe("critical");
  });

  it("never exceeds 30", () => {
    const s = scoreThumbnail(goodThumbnail());
    expect(s.earned).toBeLessThanOrEqual(30);
  });
});

describe("scoreTitle", () => {
  it("scores 0 for empty title", () => {
    const s = scoreTitle(null);
    expect(s.earned).toBe(0);
    expect(s.max).toBe(25);
  });

  it("gives a high score for a well-formed title", () => {
    const a = analyzeTitle("【徹底比較】動画編集ソフトを1年間使った結果 2024年版");
    const s = scoreTitle(a);
    expect(s.earned).toBeGreaterThanOrEqual(15);
    expect(s.severity).not.toBe("critical");
  });

  it("penalizes a very long title", () => {
    const a = analyzeTitle("あ".repeat(120));
    const s = scoreTitle(a);
    expect(s.reasons.some((r) => r.text.includes("長く"))).toBe(true);
  });

  it("penalizes all-symbols-titles", () => {
    const a = analyzeTitle("！！！！");
    const s = scoreTitle(a);
    expect(s.severity).toBe("critical");
  });
});

describe("scoreTitleThumbnail", () => {
  it("scores partial for missing thumb text", () => {
    const r = analyzeTitleThumbnail("動画編集のコツ", "");
    const s = scoreTitleThumbnail(r);
    expect(s.earned).toBe(5);
    expect(s.severity).toBe("info");
  });

  it("penalizes duplicate-role titles", () => {
    const r = analyzeTitleThumbnail(
      "1年間動画編集を続けた結果がこちら 収益公開",
      "1年間動画編集 収益公開"
    );
    const s = scoreTitleThumbnail(r);
    expect(r.duplicateRole).toBe(true);
    expect(s.earned).toBeLessThan(15);
    expect(s.reasons.some((x) => x.text.includes("役割が重複"))).toBe(true);
  });
});

describe("scoreDescription", () => {
  it("scores 0/info for empty description", () => {
    const s = scoreDescription(analyzeDescription(""));
    expect(s.earned).toBe(0);
    expect(s.severity).toBe("info");
  });

  it("scores well for a solid description", () => {
    const d = analyzeDescription(
      "この動画では動画編集の基本を解説します。\n\nhttps://example.com\n\n#編集 #初心者 #まとめ"
    );
    const s = scoreDescription(d);
    expect(s.earned).toBeGreaterThanOrEqual(6);
  });
});

describe("scoreChapters", () => {
  it("scores 0/info for no chapters", () => {
    const s = scoreChapters(null);
    expect(s.earned).toBe(0);
    expect(s.severity).toBe("info");
  });

  it("scores full marks for a perfect chapter list", () => {
    const c = analyzeChapters("00:00 オープニング\n1:30 第一章\n4:32 まとめ", 300);
    const s = scoreChapters(c);
    expect(s.earned).toBe(5);
  });

  it("penalizes out-of-range chapters", () => {
    const c = analyzeChapters("00:00 A\n20:00 B", 60);
    const s = scoreChapters(c);
    expect(s.earned).toBeLessThanOrEqual(4);
    expect(s.reasons.some((r) => r.text.includes("動画尺を超える"))).toBe(true);
  });
});

describe("scoreHashtags", () => {
  it("scores 0/info for no hashtags", () => {
    const s = scoreHashtags(analyzeHashtags(""));
    expect(s.earned).toBe(0);
    expect(s.severity).toBe("info");
  });

  it("scores decent count for 3-10 unique tags", () => {
    const s = scoreHashtags(analyzeHashtags("編集 初心者 まとめ YouTube"));
    expect(s.earned).toBeGreaterThanOrEqual(3);
  });
});

describe("scoreTechnical", () => {
  it("scores 0 for no thumbnail and no inputs", () => {
    const s = scoreTechnical({
      thumbnailAnalyzed: false,
      duration: null,
      chapters: null,
      description: null,
      titleAnalysis: null,
    });
    expect(s.earned).toBeLessThanOrEqual(2);
  });

  it("scores full marks when everything is set", () => {
    const s = scoreTechnical({
      thumbnailAnalyzed: true,
      duration: { raw: "5:30", seconds: 330, valid: true, errors: [] },
      chapters: analyzeChapters("00:00 A\n1:00 B", 360),
      description: analyzeDescription("良い説明"),
      titleAnalysis: analyzeTitle("動画編集2024年まとめ"),
    });
    expect(s.earned).toBe(5);
  });
});

describe("category contract", () => {
  it("every score category carries key, label, max, earned, severity, reasons", () => {
    const cats = [
      scoreThumbnail(goodThumbnail()),
      scoreTitle(analyzeTitle("動画編集2024年まとめ")),
      scoreTitleThumbnail(analyzeTitleThumbnail("a", "b")),
      scoreDescription(analyzeDescription("x") as DescriptionAnalysis),
      scoreChapters(analyzeChapters("", null) as ChapterAnalysis),
      scoreHashtags(analyzeHashtags("a")),
      scoreTechnical({ thumbnailAnalyzed: false, duration: null, chapters: null, description: null, titleAnalysis: null }),
    ];
    for (const c of cats) {
      expect(c.key).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.max).toBeGreaterThan(0);
      expect(Array.isArray(c.reasons)).toBe(true);
      expect(c.earned).toBeGreaterThanOrEqual(0);
      expect(c.earned).toBeLessThanOrEqual(c.max);
    }
  });
});