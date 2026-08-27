import type { AppSettings, DiagnosisResult, HistoryEntry } from "@/types";

const LS_SETTINGS = "yp_settings_v1";
const LS_HISTORY = "yp_history_v1";
const LS_THEME = "yp_theme_v1";
const IDB_NAME = "youtube-preflight";
const IDB_STORE = "thumbnails";

export const defaultSettings: AppSettings = {
  theme: "auto",
  historyEnabled: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : parsed.theme === "auto" ? "auto" : defaultSettings.theme,
      historyEnabled: typeof parsed.historyEnabled === "boolean" ? parsed.historyEnabled : true,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable: fail silently, settings persist only in memory.
  }
}

export function loadThemePreference(): AppSettings["theme"] {
  try {
    const t = localStorage.getItem(LS_THEME);
    if (t === "light" || t === "dark" || t === "auto") return t;
  } catch {
    // ignore
  }
  return "auto";
}

export function saveThemePreference(theme: AppSettings["theme"]): void {
  try {
    localStorage.setItem(LS_THEME, theme);
  } catch {
    // ignore
  }
}

function readHistoryRaw(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

/** History records never embed the thumbnail bytes; only a reference id. */
export function toHistoryEntry(result: DiagnosisResult): Omit<HistoryEntry, "thumbnailId" | "hasThumbnail"> {
  const { thumbnail: _thumb, ...input } = result.input;
  void _thumb;
  const safeInput = {
    ...result.input,
    thumbnail: result.input.thumbnail
      ? { id: result.input.thumbnail.id, name: result.input.thumbnail.name, type: result.input.thumbnail.type, size: result.input.thumbnail.size, dataUrl: "" }
      : null,
  };
  void input;
  return {
    id: result.id,
    createdAt: result.createdAt,
    title: result.input.title || "（タイトル未入力）",
    totalScore: result.totalScore,
    warningCount: result.summary.warning,
    criticalCount: result.summary.critical,
    input: safeInput,
    result,
  };
}

export function loadHistory(): HistoryEntry[] {
  return readHistoryRaw()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 200);
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  const list = readHistoryRaw().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  const trimmed = list.slice(0, 200);
  try {
    localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded: drop oldest entries until it fits.
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed.slice(0, 50)));
    } catch {
      // Give up rather than crash.
    }
  }
}

export function deleteHistoryEntry(id: string): void {
  const list = readHistoryRaw().filter((e) => e.id !== id);
  try {
    localStorage.setItem(LS_HISTORY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(LS_HISTORY);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* IndexedDB thumbnail blobs                                           */
/* ------------------------------------------------------------------ */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB が利用できません"));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB を開けませんでした"));
  });
}

export async function saveThumbnailBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put({ id, blob, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("保存に失敗"));
    });
    db.close();
  } catch {
    // History still saves without the thumbnail blob.
  }
}

export async function loadThumbnailBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    const value = await new Promise<{ blob: Blob } | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => resolve(req.result as { blob: Blob } | undefined);
      req.onerror = () => reject(req.error ?? new Error("読み込み失敗"));
    });
    db.close();
    return value?.blob ?? null;
  } catch {
    return null;
  }
}

export async function deleteThumbnailBlob(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("削除失敗"));
    });
    db.close();
  } catch {
    // ignore
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(LS_HISTORY);
    localStorage.removeItem(LS_SETTINGS);
    localStorage.removeItem(LS_THEME);
  } catch {
    // ignore
  }
  try {
    const req = indexedDB.deleteDatabase(IDB_NAME);
    req.onblocked = () => {
      // Another tab may hold it open; ignore.
    };
  } catch {
    // ignore
  }
}