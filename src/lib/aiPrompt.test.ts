import { describe, expect, it } from "vitest";
import { AI_MODEL_ID, buildAiMessages } from "@/lib/aiPrompt";

describe("buildAiMessages", () => {
  it("builds system and user messages", () => {
    const messages = buildAiMessages({ title: "テスト動画" });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("includes title, duration, genre, target, hashtags", () => {
    const messages = buildAiMessages({
      title: "動画タイトル",
      durationRaw: "12:34",
      genre: "教育",
      target: "初心者",
      hashtags: ["#動画編集", "解説"],
    });
    const user = messages[1].content;
    expect(user).toContain("動画タイトル");
    expect(user).toContain("12:34");
    expect(user).toContain("教育");
    expect(user).toContain("初心者");
    expect(user).toContain("#動画編集");
    expect(user).toContain("#解説");
  });

  it("truncates long descriptions to the char limit", () => {
    const long = "あ".repeat(5000);
    const messages = buildAiMessages({ description: long });
    expect(messages[1].content).toContain(`${"あ".repeat(1500)}…`);
  });

  it("limits chapter lines to the first 8", () => {
    const chapters = Array.from({ length: 12 }, (_, i) => `${i}: Chapter${i}`).join("\n");
    const messages = buildAiMessages({ chaptersRaw: chapters });
    const user = messages[1].content;
    expect(user).not.toContain("Chapter11");
    expect(user.split("Chapter").length - 1).toBeLessThanOrEqual(8);
  });

  it("handles empty input gracefully", () => {
    const messages = buildAiMessages({});
    expect(messages[1].content).toContain("入力された情報はありません");
  });

  it("defines a known model", () => {
    expect(AI_MODEL_ID).toBe("onnx-community/Qwen2.5-0.5B-Instruct");
  });
});