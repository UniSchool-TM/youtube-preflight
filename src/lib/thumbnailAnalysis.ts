import type {
  DominantColor,
  LuminanceHistogram,
  ThumbnailAnalysis,
} from "@/types";
import {
  edgeMetric,
  extractDominantColors,
  luminance,
  luminanceHistogram,
  rgbToHex,
  rgbToHsl,
} from "@/lib/color";

export interface ThumbnailMeta {
  width: number;
  height: number;
  format: string;
  fileSize: number;
}

export interface ThumbnailStatsResult {
  brightness: number;
  saturation: number;
  contrast: number;
  edge: number;
  edgesPerPixel: number;
  colors: DominantColor[];
  histogram: LuminanceHistogram;
}

/** Pure, deterministic stats computation from RGBA image data + metadata. */
export function computeThumbnailStats(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ThumbnailStatsResult {
  const total = width * height;
  const luma = new Float32Array(total);
  let sum = 0;
  let satSum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = luminance(r, g, b);
    luma[p] = l;
    sum += l;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
  }
  const meanLuma = sum / total;
  let varSum = 0;
  for (let p = 0; p < total; p++) {
    const d = luma[p] - meanLuma;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / total);
  const contrast = Math.min(1, std / 128);

  const brightness = meanLuma / 255;
  const saturation = total === 0 ? 0 : satSum / total;

  const edge = edgeMetric(luma, width, height);

  const rawColors = extractDominantColors(data, 6);
  const colors: DominantColor[] = rawColors.map(({ rgb, ratio }) => {
    const [r, g, b] = rgb;
    const [h, s, l] = rgbToHsl(r, g, b);
    return { hex: rgbToHex(r, g, b), rgb: [r, g, b], hsl: [h, s, l], ratio };
  });

  const histogram = luminanceHistogram(data, width, height);

  return {
    brightness,
    saturation,
    contrast,
    edge,
    edgesPerPixel: edge,
    colors,
    histogram,
  };
}

export function buildAnalysis(
  stats: ThumbnailStatsResult,
  meta: ThumbnailMeta,
  sampledWidth: number,
  sampledHeight: number,
  errors: string[] = []
): ThumbnailAnalysis {
  return {
    width: meta.width,
    height: meta.height,
    aspectRatio: meta.height === 0 ? 0 : meta.width / meta.height,
    format: meta.format,
    fileSize: meta.fileSize,
    totalPixels: meta.width * meta.height,
    avgBrightness: stats.brightness,
    avgSaturation: stats.saturation,
    contrast: stats.contrast,
    edgeAmount: stats.edge,
    edgesPerPixel: stats.edgesPerPixel,
    dominantColors: stats.colors,
    luminanceHistogram: stats.histogram.bins,
    sampledWidth,
    sampledHeight,
    errors,
  };
}

export function brightnessLabel(b: number): "暗すぎる" | "適正" | "明るすぎる" {
  if (b < 0.3) return "暗すぎる";
  if (b > 0.78) return "明るすぎる";
  return "適正";
}

export function contrastLabel(c: number): "低コントラスト" | "適正" | "高コントラスト" {
  if (c < 0.16) return "低コントラスト";
  if (c > 0.42) return "高コントラスト";
  return "適正";
}

export function saturationLabel(s: number): "低彩度" | "適正" | "高彩度" {
  if (s < 0.16) return "低彩度";
  if (s > 0.7) return "高彩度";
  return "適正";
}

export function edgeLabel(e: number): "情報量が少ない" | "適正" | "情報量が多い" {
  if (e < 0.14) return "情報量が少ない";
  if (e > 0.4) return "情報量が多い";
  return "適正";
}