export type Rgb = [number, number, number];

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, v];
}

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Simple bucket-based dominant color extraction.
 * Buckets HSV into coarse grid, accumulates weighted color, returns top `count` colors by pixel ratio.
 */
export function extractDominantColors(
  data: Uint8ClampedArray,
  count = 5
): { rgb: Rgb; ratio: number }[] {
  const H_BUCKETS = 18;
  const S_BUCKETS = 3;
  const V_BUCKETS = 4;
  const total = data.length / 4;
  if (total === 0) return [];

  const buckets = new Map<number, { sumR: number; sumG: number; sumB: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    const [h, s, v] = rgbToHsv(r, g, b);
    const hb = Math.min(H_BUCKETS - 1, Math.floor(h * H_BUCKETS));
    const sb = Math.min(S_BUCKETS - 1, Math.floor(s * S_BUCKETS));
    const vb = Math.min(V_BUCKETS - 1, Math.floor(v * V_BUCKETS));
    const key = hb * 100 + sb * 10 + vb;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sumR += r;
      bucket.sumG += g;
      bucket.sumB += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { sumR: r, sumG: g, sumB: b, n: 1 });
    }
  }

  const entries = Array.from(buckets.entries())
    .map(([, b]) => ({
      rgb: [
        Math.round(b.sumR / b.n),
        Math.round(b.sumG / b.n),
        Math.round(b.sumB / b.n),
      ] as Rgb,
      n: b.n,
    }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n);

  const totalCounted = entries.reduce((acc, e) => acc + e.n, 0) || 1;
  return entries.slice(0, count).map((e) => ({
    rgb: e.rgb,
    ratio: e.n / totalCounted,
  }));
}

/** Luminance histogram of 16 bins. */
export function luminanceHistogram(data: Uint8ClampedArray, w: number, h: number): {
  bins: number[];
  mean: number;
} {
  const bins = new Array<number>(16).fill(0);
  const total = w * h;
  if (total === 0) return { bins, mean: 0 };
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data[i], data[i + 1], data[i + 2]);
    sum += l;
    bins[Math.min(15, Math.floor(l / 16))]++;
  }
  return { bins, mean: sum / total / 255 };
}

/** Edge amount via Sobel on luma (downsampled grayscale). Returns 0-1 metric. */
export function edgeMetric(pixels: ArrayLike<number>, w: number, h: number): number {
  const GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  let sum = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let gx = 0;
      let gy = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const p = pixels[idx + dy * w + dx];
          gx += p * GX[k];
          gy += p * GY[k];
          k++;
        }
      }
      sum += Math.sqrt(gx * gx + gy * gy);
      count++;
    }
  }
  if (count === 0) return 0;
  const avg = sum / count;
  return Math.min(1, avg / 255); // max gradient ~4*255≈1020 → /255 gives ~0-1 range, cap at 1
}