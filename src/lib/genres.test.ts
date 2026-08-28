import { describe, expect, it } from "vitest";
import {
  GENRES,
  findGenreKeyword,
  findGenreKeywordByOption,
  resolveGenre,
} from "@/lib/genres";

describe("GENRES", () => {
  it("lists the 15 official YouTube categories", () => {
    expect(GENRES).toHaveLength(15);
    expect(GENRES.map((g) => g.label)).toEqual([
      "映画・アニメーション",
      "自動車・乗り物",
      "音楽",
      "ペット・動物",
      "スポーツ",
      "旅行・イベント",
      "ゲーム",
      "ブログ・人物",
      "コメディ",
      "エンターテインメント",
      "ニュース・政治",
      "ハウツー・スタイル",
      "教育",
      "科学・テクノロジー",
      "非営利団体・活動",
    ]);
  });

  it("resolves by Japanese label only", () => {
    expect(resolveGenre("ゲーム")?.id).toBe("gaming");
    expect(resolveGenre("ゲーム実況")).toBeUndefined();
  });
});

describe("findGenreKeyword", () => {
  it("matches a known keyword case-insensitively", () => {
    expect(findGenreKeyword("ゲーム", ["人気のGameをレビュー"])).toBe("game");
    expect(findGenreKeyword("音楽", ["毎週音楽を配信します"])).toBe("音楽");
  });

  it("returns null for unknown labels or no match", () => {
    expect(findGenreKeyword("ゲーム", ["日常の記録"])).toBeNull();
    expect(findGenreKeyword("カスタム", ["ゲーム"])).toBeNull();
  });

  it("matches multi-character Japanese keywords", () => {
    expect(
      findGenreKeywordByOption(GENRES[0], ["短編映画を自作しました"])
    ).toBe("映画");
  });
});