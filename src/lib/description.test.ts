import { describe, expect, it } from "vitest";
import { analyzeDescription, parseUrl } from "@/lib/description";
import type { UrlInfo } from "@/types";

describe("parseUrl", () => {
  it("classifies https vs http vs www shorthand", () => {
    expect(parseUrl("https://example.com/a")?.isHttps).toBe(true);
    expect(parseUrl("http://example.com/a")?.isHttps).toBe(false);
    const www = parseUrl("www.example.com")!;
    expect(www.isHttps).toBe(false);
    expect(www.host).toBe("www.example.com");
    expect(www.normalized).toBe("http://www.example.com/");
  });

  it("marks malformed URLs invalid", () => {
    const r = parseUrl("example.com is not a url");
    expect(r?.normalized).toBe("");
    expect(r?.host).toBe("");
  });
});

describe("analyzeDescription", () => {
  it("counts urls and https violations", () => {
    const d = analyzeDescription(
      "詳細は https://example.com/a と http://example.com/b をご覧ください"
    );
    expect(d.urlCount).toBe(2);
    expect(d.nonHttpsCount).toBe(1);
  });

  it("counts hashtags and mentions", () => {
    const d = analyzeDescription("見どころ #編集 #編集 @yt_preflight #解説");
    expect(d.hashtagCount).toBe(3);
    expect(d.mentionCount).toBe(1);
  });

  it("detects duplicate urls", () => {
    const d = analyzeDescription(
      "a https://example.com/a b https://example.com/a c https://example.com/b"
    );
    expect(d.duplicateUrls).toHaveLength(1);
    expect(d.warnings.some((w) => w.label === "重複URL")).toBe(true);
  });

  it("detects trailing and unnatural whitespace", () => {
    expect(analyzeDescription("text ").trailingWhitespace).toBe(true);
    expect(analyzeDescription("a\tb").unnaturalWhitespace).toBe(true);
    expect(analyzeDescription("a  b").unnaturalWhitespace).toBe(true);
  });

  it("computes consecutive empty lines", () => {
    const d = analyzeDescription("head\n\n\n\ntail");
    expect(d.maxConsecutiveEmptyLines).toBe(3);
    expect(d.warnings.some((w) => w.label === "空行")).toBe(true);
  });

  it("computes first line length and line widths", () => {
    const d = analyzeDescription("これは最初の行です。\n二行目\n\n\n");
    expect(d.firstLineLength).toBe(10);
    expect(d.lineCount).toBe(5);
  });

  it("handles empty input", () => {
    const d = analyzeDescription("");
    expect(d.length).toBe(0);
    expect(d.lineCount).toBe(1);
    expect(d.urlCount).toBe(0);
    expect(d.warnings[0].label).toBe("概要欄");
  });

  it("keeps urls in order of appearance", () => {
    const d = analyzeDescription("x https://a.example/1 y https://b.example/2");
    const hosts: string[] = d.urls.map((u: UrlInfo) => u.host);
    expect(hosts).toEqual(["a.example", "b.example"]);
  });
});