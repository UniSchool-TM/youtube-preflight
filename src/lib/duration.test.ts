import { describe, expect, it } from "vitest";
import { formatSeconds, parseDuration } from "@/lib/duration";

describe("parseDuration", () => {
  it("parses MM:SS", () => {
    const r = parseDuration("5:30");
    expect(r.valid).toBe(true);
    expect(r.seconds).toBe(330);
  });

  it("parses HH:MM:SS", () => {
    const r = parseDuration("1:02:30");
    expect(r.valid).toBe(true);
    expect(r.seconds).toBe(3750);
  });

  it("accepts long videos via MM:SS (2h30)", () => {
    const r = parseDuration("150:00");
    expect(r.valid).toBe(true);
    expect(r.seconds).toBe(9000);
  });

  it("rejects 0:00 (must be >= 1 second)", () => {
    const r = parseDuration("0:00");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("1 秒以上");
  });

  it("rejects seconds above 59", () => {
    expect(parseDuration("5:99").valid).toBe(false);
  });

  it("rejects minutes above 59 in HH:MM:SS", () => {
    expect(parseDuration("1:60:00").valid).toBe(false);
  });

  it("rejects durations above 99:59:59", () => {
    const r = parseDuration("100:00:00");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("99:59:59");
  });

  it("rejects garbage input", () => {
    for (const bad of ["abc", "5", "5:6:7:8", "--", "1:2X"]) {
      expect(parseDuration(bad).valid, bad).toBe(false);
    }
  });

  it("handles empty input as invalid-not-parsed", () => {
    expect(parseDuration("").valid).toBe(false);
    expect(parseDuration("").seconds).toBeNull();
  });
});

describe("formatSeconds", () => {
  it("formats h:mm:ss when >= 1h", () => {
    expect(formatSeconds(3750)).toBe("1:02:30");
  });
  it("formats m:ss otherwise", () => {
    expect(formatSeconds(330)).toBe("5:30");
    expect(formatSeconds(60)).toBe("1:00");
  });
});