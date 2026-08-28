import { describe, expect, it } from "vitest";
import {
  PRIVACY_NOTE,
  allPass,
  analyzeTextInputs,
  buildChecklist,
  generateId,
  runDiagnosis,
  summarize,
} from "@/lib/diagnose";
import type { DiagnosisInput, ThumbnailAnalysis } from "@/types";

const goodInput: DiagnosisInput = {
  title: "【徹底比較】動画編集ソフトを1年間使った結果 2024年版",
  description:
    "この動画では動画編集ソフトを比較します。\n\n詳しくは https://example.com をご覧ください。\n\n#編集 #比較 #初心者",
  chaptersRaw: "00:00 オープニング\n1:30 第一章\n4:32 まとめ",
  hashtagsRaw: "編集 比較 初心者",
  durationRaw: "5:00",
  durationSeconds: 300,
  thumbnailText: "動画編集ソフト",
  thumbnail: {
    id: "test-thumb",
    name: "test.png",
    type: "image/png",
    size: 500000,
    dataUrl: "",
  },
  genre: "勉強",
  target: "中級者",
};

function goodThumbnail(): ThumbnailAnalysis {
  return {
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    format: "PNG",
    fileSize: 500000,
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

describe("analyzeTextInputs", () => {
  it("parses all inputs into a bundle", () => {
    const b = analyzeTextInputs(goodInput);
    expect(b.title).not.toBeNull();
    expect(b.description!.length).toBeGreaterThan(0);
    expect(b.chapters!.chapters).toHaveLength(3);
    expect(b.hashtags!.count).toBe(3);
    expect(b.duration.seconds).toBe(300);
    expect(b.relation!.hasTitle).toBe(true);
    expect(b.relation!.hasThumbnailText).toBe(true);
  });

  it("returns nulls for empty input", () => {
    const empty: DiagnosisInput = {
      title: "",
      description: "",
      chaptersRaw: "",
      hashtagsRaw: "",
      durationRaw: "",
      thumbnailText: "",
      thumbnail: null,
      durationSeconds: null,
      genre: "",
      target: "",
    };
    const b = analyzeTextInputs(empty);
    expect(b.title).toBeNull();
    expect(b.description!.length).toBe(0);
    expect(b.chapters!.chapters).toHaveLength(0);
    expect(b.hashtags!.count).toBe(0);
    expect(b.duration.raw).toBe("");
    expect(b.duration.seconds).toBeNull();
    expect(b.relation!.hasTitle).toBe(false);
  });
});

describe("runDiagnosis", () => {
  it("is deterministic for identical inputs", () => {
    const text = analyzeTextInputs(goodInput);
    const a = runDiagnosis(goodInput, goodThumbnail(), text);
    const b = runDiagnosis(goodInput, goodThumbnail(), text);
    expect(a.totalScore).toBe(b.totalScore);
    expect(a.scores.map((s) => s.earned)).toEqual(b.scores.map((s) => s.earned));
    expect(a.checklist.map((c) => c.status)).toEqual(b.checklist.map((c) => c.status));
  });

  it("totalScore equals sum of category earned", () => {
    const text = analyzeTextInputs(goodInput);
    const r = runDiagnosis(goodInput, goodThumbnail(), text);
    const sum = r.scores.reduce((a, s) => a + s.earned, 0);
    expect(r.totalScore).toBe(sum);
  });

  it("gives a high score for a strong submission", () => {
    const text = analyzeTextInputs(goodInput);
    const r = runDiagnosis(goodInput, goodThumbnail(), text);
    expect(r.totalScore).toBeGreaterThanOrEqual(60);
    expect(r.id).toMatch(/^yp_/);
    expect(r.privacyNote).toBe(PRIVACY_NOTE);
  });

  it("scores ~0 and flags unset items for an empty submission", () => {
    const empty: DiagnosisInput = {
      title: "",
      description: "",
      chaptersRaw: "",
      hashtagsRaw: "",
      durationRaw: "",
      thumbnailText: "",
      thumbnail: null,
      durationSeconds: null,
      genre: "",
      target: "",
    };
    const text = analyzeTextInputs(empty);
    const r = runDiagnosis(empty, null, text);
    expect(r.totalScore).toBeLessThanOrEqual(5);
    expect(r.summary.unset).toBeGreaterThanOrEqual(4);
    expect(r.summary.critical).toBeGreaterThanOrEqual(2);
    expect(allPass(r)).toBe(false);
  });
});

describe("buildChecklist", () => {
  it("builds 14 items covering every area", () => {
    const text = analyzeTextInputs(goodInput);
    const list = buildChecklist({
      thumbnail: goodThumbnail(),
      title: text.title,
      relation: text.relation,
      description: text.description,
      chapters: text.chapters,
      hashtags: text.hashtags,
      duration: text.duration,
      genre: goodInput.genre,
      titleText: goodInput.title,
      descriptionText: goodInput.description,
    });
    expect(list).toHaveLength(14);
    const keys = new Set(list.map((i) => i.key));
    expect(keys).toEqual(
      new Set([
        "thumb-resolution",
        "thumb-ratio",
        "thumb-size",
        "thumb-visibility",
        "title-length",
        "title-structure",
        "title-duplication",
        "description",
        "url",
        "hashtag",
        "chapter",
        "duration",
        "genre",
        "technical",
      ])
    );
  });

  it("marks genre as unset when empty, pass when keyword is present", () => {
    const text = analyzeTextInputs(goodInput);
    const base = {
      thumbnail: goodThumbnail(),
      title: text.title,
      relation: text.relation,
      description: text.description,
      chapters: text.chapters,
      hashtags: text.hashtags,
      duration: text.duration,
    };
    const noGenre = buildChecklist({ ...base, genre: "", titleText: "", descriptionText: "" });
    const genreItem = noGenre.find((i) => i.key === "genre");
    expect(genreItem?.status).toBe("unset");

    const hit = buildChecklist({
      ...base,
      genre: "ゲーム",
      titleText: "【検証】人気のゲームを徹底レビュー",
      descriptionText: "",
    });
    const hitItem = hit.find((i) => i.key === "genre");
    expect(hitItem?.status).toBe("pass");
    expect(hitItem?.detail).toContain("ゲーム");

    const miss = buildChecklist({
      ...base,
      genre: "ゲーム",
      titleText: "毎朝着替えを投稿",
      descriptionText: "日常の記録",
    });
    expect(miss.find((i) => i.key === "genre")?.status).toBe("info");
  });

  it("totals statuses correctly via summarize", () => {
    const text = analyzeTextInputs(goodInput);
    const list = buildChecklist({
      thumbnail: goodThumbnail(),
      title: text.title,
      relation: text.relation,
      description: text.description,
      chapters: text.chapters,
      hashtags: text.hashtags,
      duration: text.duration,
      genre: goodInput.genre,
      titleText: goodInput.title,
      descriptionText: goodInput.description,
    });
    const s = summarize(list);
    const total = s.critical + s.warning + s.info + s.pass + s.unset;
    expect(total).toBe(14);
    expect(s.critical + s.warning).toBe(
      list.filter((c) => c.status === "critical" || c.status === "warning").length
    );
  });
});

describe("generateId", () => {
  it("produces unique prefixed ids", () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a.startsWith("yp_")).toBe(true);
  });
});