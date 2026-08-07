type StorageType = 'sessionStorage' | 'memory';

interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class MemoryStorage implements StorageBackend {
  private data: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

function isSessionStorageAvailable(): boolean {
  // SSR: no window at all.
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.sessionStorage.setItem(testKey, 'test');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

let activeStorage: StorageBackend;
let storageType: StorageType;

function initializeStorage(): void {
  if (isSessionStorageAvailable()) {
    activeStorage = window.sessionStorage as unknown as StorageBackend;
    storageType = 'sessionStorage';
  } else {
    activeStorage = new MemoryStorage();
    storageType = 'memory';
  }
}

export function getActiveStorageType(): StorageType {
  if (!activeStorage) initializeStorage();
  return storageType;
}

export function safeGetItem(key: string): string | null {
  try {
    if (!activeStorage) initializeStorage();
    return activeStorage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Error reading "${key}":`, error);
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (!activeStorage) initializeStorage();
    activeStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('[Storage] QuotaExceededError, switching to memory');
      activeStorage = new MemoryStorage();
      storageType = 'memory';
      activeStorage.setItem(key, value);
      return true;
    }
    console.error(`[Storage] Error writing "${key}":`, error);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    if (!activeStorage) initializeStorage();
    activeStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing "${key}":`, error);
    return false;
  }
}

export function safeClearStorage(): boolean {
  try {
    if (!activeStorage) initializeStorage();
    activeStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing:', error);
    return false;
  }
}

initializeStorage();

/**
 * Object API used across the app (onboarding quiz, restore hook).
 * Backed by the same safe storage above.
 */
export const safeStorage = {
  get: safeGetItem,
  set: safeSetItem,
  remove: safeRemoveItem,
  clear: safeClearStorage,
  getType: getActiveStorageType,

  getJSON<T>(key: string): T | null {
    const raw = safeGetItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJSON(key: string, value: unknown): boolean {
    try {
      return safeSetItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};

export default {
  getItem: safeGetItem,
  setItem: safeSetItem,
  removeItem: safeRemoveItem,
  clear: safeClearStorage,
  getType: getActiveStorageType,
};
