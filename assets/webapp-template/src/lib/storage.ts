// Pluggable persistence backend. Defaults to localStorage in the browser and a
// memory backend everywhere else (tests, SSR). Swap in IndexedDB for large data
// by implementing the same interface.

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryBackend(initial?: Record<string, string>): StorageBackend {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
  };
}

export function getDefaultBackend(): StorageBackend {
  try {
    if (typeof localStorage !== 'undefined') {
      const probe = '__rlb_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    // localStorage can throw in private mode; fall back to memory.
  }
  return createMemoryBackend();
}

export function readJSON<T>(backend: StorageBackend, key: string): T | null {
  const raw = backend.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(backend: StorageBackend, key: string, value: unknown): void {
  backend.setItem(key, JSON.stringify(value));
}
