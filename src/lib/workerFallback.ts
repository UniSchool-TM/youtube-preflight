import type { ThumbnailStatsResult } from "@/lib/thumbnailAnalysis";
import { computeThumbnailStats } from "@/lib/thumbnailAnalysis";

/**
 * Chunked fallback for environments where Web Workers are unavailable.
 * The image is already downsampled (max 420px) before reaching this point,
 * so a single deterministic pass is cheap. We still yield to the event loop
 * first so the UI can paint before the computation runs.
 */
export async function computeStatsChunked(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Promise<ThumbnailStatsResult> {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => requestAnimationFrame(r));
  return computeThumbnailStats(data, width, height);
}