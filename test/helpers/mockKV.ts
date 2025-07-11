import { vi } from "vitest";
import type { KVNamespace } from "@cloudflare/workers-types";

/**
 * Mock KV namespace that extends Cloudflare's KVNamespace with test utilities
 */
export interface MockKVNamespace extends KVNamespace {
  /**
   * Get the underlying storage for direct access in tests
   */
  getStoredValue(key: string): string | null;

  /**
   * Get all stored keys (useful for debugging tests)
   */
  getAllKeys(): string[];

  /**
   * Clear all stored data
   */
  clear(): void;

  /**
   * Reset all mock function calls
   */
  resetMocks(): void;

  /**
   * Advance the mock time (for TTL testing)
   */
  advanceTime(ms: number): void;
}

/**
 * Creates a mock KV namespace for testing
 */
export function createMockKV(): MockKVNamespace {
  const storage = new Map<string, string>();
  const ttlStorage = new Map<string, number>();
  let currentTime = Date.now();

  const mockKV: MockKVNamespace = {
    get: vi.fn(async (key: string, type?: any) => {
      const ttl = ttlStorage.get(key);
      if (ttl && ttl < currentTime) {
        storage.delete(key);
        ttlStorage.delete(key);
        return null;
      }
      const value = storage.get(key) ?? null;

      if (type === "json" && value !== null) {
        return JSON.parse(value);
      }

      return value;
    }) as any,

    put: vi.fn(async (key: string, value: string, options?: any) => {
      storage.set(key, value);
      if (options?.expirationTtl) {
        ttlStorage.set(key, currentTime + options.expirationTtl * 1000);
      }
    }),

    delete: vi.fn(async (key: string) => {
      storage.delete(key);
      ttlStorage.delete(key);
    }),

    list: vi.fn(async () => {
      return {
        keys: Array.from(storage.keys()).map((name) => ({ name })),
        list_complete: true,
        cursor: undefined,
        cacheStatus: null,
      };
    }) as any,

    getWithMetadata: vi.fn(async () => {
      throw new Error("getWithMetadata not implemented in mock");
    }),

    // Test utilities
    getStoredValue: (key: string) => storage.get(key) ?? null,
    getAllKeys: () => Array.from(storage.keys()),
    clear: () => {
      storage.clear();
      ttlStorage.clear();
    },
    resetMocks: () => {
      vi.clearAllMocks();
    },
    advanceTime: (ms: number) => {
      currentTime += ms;
    },
  };

  return mockKV;
}

/**
 * Creates a mock KV namespace with pre-populated data
 */
export function createMockKVWithData(data: Record<string, string>): MockKVNamespace {
  const mockKV = createMockKV();

  for (const [key, value] of Object.entries(data)) {
    mockKV.put(key, value);
  }

  return mockKV;
}
