"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiagnosisResult, HistoryEntry } from "@/types";
import {
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  saveHistoryEntry,
  saveThumbnailBlob,
  toHistoryEntry,
} from "@/lib/storage";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    // localStorage はクライアント専用のため初期データはマウント後に読み込む。
    // SSR の空状態と整合させるため、このEffect内での setState は意図的。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from localStorage (client-only)
    reload();
    setLoaded(true);
  }, [reload]);

  const saveResult = useCallback(
    async (result: DiagnosisResult, thumbnailFile: File | null) => {
      const base = toHistoryEntry(result);
      let hasThumbnail = false;
      let thumbnailId: string | null = null;
      if (thumbnailFile && result.input.thumbnail?.id) {
        const id = result.input.thumbnail.id;
        try {
          await saveThumbnailBlob(id, thumbnailFile);
          hasThumbnail = true;
          thumbnailId = id;
        } catch {
          // History still saves without the thumbnail blob.
        }
      }
      const entry: HistoryEntry = { ...base, hasThumbnail, thumbnailId };
      saveHistoryEntry(entry);
      reload();
      return entry;
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      const target = history.find((h) => h.id === id);
      deleteHistoryEntry(id);
      if (target?.thumbnailId) {
        await deleteThumbnailBlobSafe(target.thumbnailId);
      }
      reload();
    },
    [history, reload]
  );

  const clear = useCallback(async () => {
    for (const h of history) {
      if (h.thumbnailId) await deleteThumbnailBlobSafe(h.thumbnailId);
    }
    clearHistory();
    reload();
  }, [history, reload]);

  return { history, loaded, reload, saveResult, remove, clear };
}

async function deleteThumbnailBlobSafe(id: string): Promise<void> {
  try {
    const { deleteThumbnailBlob } = await import("@/lib/storage");
    await deleteThumbnailBlob(id);
  } catch {
    // ignore
  }
}