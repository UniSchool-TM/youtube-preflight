import type { TitleToken } from "@/types";

export type DeviceSim = "pc" | "tablet" | "phone";

export const DEVICE_WIDTHS: Record<DeviceSim, number> = {
  pc: 520,
  tablet: 380,
  phone: 300,
};

export const DEVICE_LABELS: Record<DeviceSim, string> = {
  pc: "PC",
  tablet: "タブレット",
  phone: "スマートフォン",
};

const FONT = "600 18px system-ui, -apple-system, sans-serif";

function measureCharWidths(text: string): number[] {
  if (typeof document === "undefined") {
    // SSR fallback: approximate char widths (CJK wide, others half-width).
    return Array.from(text).map((ch) => (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 18 : 9));
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.font = FONT;
  return Array.from(text).map((ch) => Math.max(1, ctx.measureText(ch).width));
}

export interface DeviceCut {
  device: DeviceSim;
  charsPerLine: number;
  totalChars: number;
  cutOffset: number;
  truncated: boolean;
  hiddenImportant: TitleToken[];
}

/**
 * Estimate how many characters fit in the given container width and which
 * important tokens would fall below the visible fold (1 line for PC, 2 lines for tablet/phone).
 */
export function simulateTitleVisibility(
  text: string,
  tokens: TitleToken[],
  linesForDevice: Record<DeviceSim, number>
): DeviceCut[] {
  const chars = Array.from(text);
  if (chars.length === 0) return [];
  let widths = measureCharWidths(text);
  if (widths.length !== chars.length) {
    widths = chars.map(() => 10);
  }
  const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;

  const runs = (Object.keys(DEVICE_WIDTHS) as DeviceSim[]).map((device) => {
    const containerW = DEVICE_WIDTHS[device];
    const maxLines = linesForDevice[device];
    // greedy fill of lines
    let line = 0;
    let used = 0;
    let charIndex = 0;
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i] ?? 10;
      if (used + w > containerW && line >= maxLines) break;
      if (used + w > containerW) {
        line++;
        used = 0;
      }
      used += w;
      charIndex = i + 1;
    }
    const cutOffset = charIndex;
    const truncated = cutOffset < chars.length;
    const hiddenImportant = truncated
      ? tokens.filter((t) => t.start >= cutOffset && t.importance >= 2)
      : [];
    return {
      device,
      charsPerLine: Math.round(containerW / avgWidth),
      totalChars: chars.length,
      cutOffset,
      truncated,
      hiddenImportant,
    };
  });
  return runs;
}

export function warnTextForCut(cut: DeviceCut): string | null {
  if (!cut.truncated) return null;
  if (cut.hiddenImportant.length > 0) {
    return "タイトル後半の重要な情報が小さい画面では見えにくくなる可能性があります（重要語: " +
      cut.hiddenImportant.slice(0, 3).map((t) => t.text).join("・") +
      (cut.hiddenImportant.length > 3 ? " など" : "") + "）";
  }
  return null;
}