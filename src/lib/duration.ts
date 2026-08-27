import type { DurationAnalysis } from "@/types";

const DURATION_RE = /^\s*(\d{1,3}):([0-5]?\d)(?::([0-5]?\d))?\s*$/;

/** Parse "MM:SS", "H:MM:SS", "HH:MM:SS". Returns seconds or null when invalid. */
export function parseDuration(raw: string): DurationAnalysis {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { raw, seconds: null, valid: false, errors: ["動画尺が未入力です"] };
  }
  const m = DURATION_RE.exec(trimmed);
  if (!m) {
    return {
      raw,
      seconds: null,
      valid: false,
      errors: ["形式が正しくありません（例: 5:30 または 1:02:30）"],
    };
  }
  const first = parseInt(m[1], 10);
  const second = parseInt(m[2], 10);
  const third = m[3] !== undefined ? parseInt(m[3], 10) : null;
  // With 1:23 format MM:SS — minutes=first(max 99 for video? could be 100+min video e.g. 2h30 -> 150:00 accepted)
  const hours = third !== null ? first : 0;
  const minutes = third !== null ? second : first;
  const seconds = third !== null ? third : second;
  if (third !== null && second > 59) {
    return { raw, seconds: null, valid: false, errors: ["分の値が 59 を超えています"] };
  }
  const total = hours * 3600 + minutes * 60 + seconds;
  if (total <= 0) {
    return { raw, seconds: null, valid: false, errors: ["動画尺は 1 秒以上で指定してください"] };
  }
  if (total > 359999) {
    return {
      raw,
      seconds: null,
      valid: false,
      errors: ["動画尺が長すぎます（最大 99:59:59）"],
    };
  }
  return { raw, seconds: total, valid: true, errors: [] };
}

export function formatSeconds(total: number): string {
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}