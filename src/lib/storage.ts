/**
 * Safe sessionStorage wrapper.
 *
 * Handles:
 *  - SSR (no `window`)
 *  - Safari Private Mode (accessing sessionStorage can throw SecurityError)
 *  - QuotaExceededError on write (falls back to an in-memory store)
 */

const memoryStore = new Map<string, string>();

let sessionStorageAvailable: boolean | null = null;

function isSessionStorageAvailable(): boolean {
  if (sessionStorageAvailable !== null) return sessionStorageAvailable;
  if (typeof window === "undefined") return false;
  try {
    const probe = "__lopseliai_probe__";
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    sessionStorageAvailable = true;
  } catch {
    sessionStorageAvailable = false;
  }
  return sessionStorageAvailable;
}

export const safeStorage = {
  get(key: string): string | null {
    if (isSessionStorageAvailable()) {
      try {
        const value = window.sessionStorage.getItem(key);
        if (value !== null) return value;
      } catch {
        /* fall through to memory */
      }
    }
    return memoryStore.get(key) ?? null;
  },

  set(key: string, value: string): boolean {
    memoryStore.set(key, value);
    if (!isSessionStorageAvailable()) return false;
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      // QuotaExceededError / SecurityError — memory fallback already holds it.
      return false;
    }
  },

  remove(key: string): void {
    memoryStore.delete(key);
    if (!isSessionStorageAvailable()) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },

  getJSON<T>(key: string): T | null {
    const raw = safeStorage.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJSON(key: string, value: unknown): boolean {
    try {
      return safeStorage.set(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};
