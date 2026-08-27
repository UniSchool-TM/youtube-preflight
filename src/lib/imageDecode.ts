import type { ThumbnailAnalysis } from "@/types";
import { buildAnalysis, type ThumbnailStatsResult } from "@/lib/thumbnailAnalysis";

export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

async function decodeBitmap(file: Blob): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // fall through to element decode
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (!ctx) throw new Error("Canvas を取得できませんでした");
    ctx.drawImage(img, 0, 0);
    const bitmap = await createImageBitmap(off);
    return { bitmap, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const SUPPORTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const MAX_ANALYSIS_DIMENSION = 420;
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (file.size === 0) return "ファイルが空です";
  if (file.size > MAX_SIZE_BYTES) {
    return `ファイルサイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB）。50MB 以下の画像を選んでください`;
  }
  if (!SUPPORTED_TYPES.includes(file.type)) {
    if (file.type && !file.type.startsWith("image/")) {
      return "画像ファイルではありません（対応形式: PNG / JPEG / WebP / AVIF / GIF）";
    }
  }
  return null;
}

function formatLabel(type: string): string {
  if (type === "image/png") return "PNG";
  if (type === "image/jpeg") return "JPEG";
  if (type === "image/webp") return "WebP";
  if (type === "image/avif") return "AVIF";
  if (type === "image/gif") return "GIF";
  const m = /image\/(\w+)/.exec(type);
  return m ? m[1].toUpperCase() : type.split("/")[1]?.toUpperCase() ?? "不明";
}

function drawScaled(ctx: CanvasRenderingContext2D, bitmap: ImageBitmap, maxDim: number): { w: number; h: number } {
  const w = bitmap.width;
  const h = bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  ctx.canvas.width = dw;
  ctx.canvas.height = dh;
  ctx.drawImage(bitmap, 0, 0, dw, dh);
  return { w: dw, h: dh };
}

async function sampleImageData(bitmap: ImageBitmap, maxDim: number): Promise<{ data: Uint8ClampedArray; w: number; h: number }> {
  const off = document.createElement("canvas");
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas を取得できませんでした");
  const { w, h } = drawScaled(ctx, bitmap, maxDim);
  const img = ctx.getImageData(0, 0, w, h);
  return { data: img.data, w, h };
}

async function computeFallback(
  data: Uint8ClampedArray,
  w: number,
  h: number
): Promise<ThumbnailStatsResult> {
  // Chunked, non-blocking-ish computation on the main thread.
  const worker = await import("./workerFallback");
  return worker.computeStatsChunked(data, w, h);
}

/**
 * Main entry: decode an image file, sample it, and compute analysis
 * either in a Web Worker or via a chunked fallback.
 */
export async function analyzeThumbnailFile(
  file: File
): Promise<{ analysis: ThumbnailAnalysis; bitmap: ImageBitmap }> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const { bitmap, width, height } = await decodeBitmap(file);
  const { data, w, h } = await sampleImageData(bitmap, MAX_ANALYSIS_DIMENSION);

  let stats: ThumbnailStatsResult;
  try {
    const WorkerCtor: typeof Worker = window.Worker;
    const worker = new WorkerCtor(new URL("../workers/imageWorker", import.meta.url), { type: "module" });
    stats = await new Promise<ThumbnailStatsResult>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("画像解析がタイムアウトしました")), 15000);
      worker.onmessage = (ev: MessageEvent) => {
        clearTimeout(timer);
        const msg = ev.data;
        if (msg?.type === "result") {
          worker.terminate();
          resolve(msg.stats as ThumbnailStatsResult);
        } else if (msg?.type === "error") {
          worker.terminate();
          reject(new Error(msg.message));
        }
      };
      worker.onerror = (err) => {
        clearTimeout(timer);
        worker.terminate();
        reject(new Error(err.message || "Worker でエラーが発生しました"));
      };
      worker.postMessage({ type: "analyze", data, width: w, height: h });
    });
  } catch {
    // Fallback path: no worker (offline/restricted), compute on main thread in chunks.
    stats = await computeFallback(data, w, h);
  }

  const analysis = buildAnalysis(
    stats,
    { width, height, format: formatLabel(file.type), fileSize: file.size },
    w,
    h
  );
  return { analysis, bitmap };
}

export async function getImageDataDimensions(file: File): Promise<{ width: number; height: number }> {
  const { bitmap, width, height } = await decodeBitmap(file);
  bitmap.close();
  return { width, height };
}