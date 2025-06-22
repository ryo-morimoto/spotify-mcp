import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTokenStorage, getCodeChallengeStorage } from './index.ts';

// Mock the memory module
vi.mock('./memory.ts', () => ({
  createInMemoryTokenStorage: vi.fn(() => ({
    store: vi.fn(),
    get: vi.fn(),
    clear: vi.fn(),
  })),
  createInMemoryCodeChallengeStorage: vi.fn(() => ({
    store: vi.fn(),
    get: vi.fn(),
    clear: vi.fn(),
  })),
}));

describe('Storage Factory Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state by re-importing
    vi.resetModules();
  });

  describe('getTokenStorage', () => {
    it('should return a token storage instance', async () => {
      const { getTokenStorage } = await import('./index.ts');
      const storage = getTokenStorage();

      expect(storage).toBeDefined();
      expect(storage.store).toBeDefined();
      expect(storage.get).toBeDefined();
      expect(storage.clear).toBeDefined();
    });

    it('should return the same instance on multiple calls (singleton)', async () => {
      const { getTokenStorage } = await import('./index.ts');
      const storage1 = getTokenStorage();
      const storage2 = getTokenStorage();
      const storage3 = getTokenStorage();

      expect(storage1).toBe(storage2);
      expect(storage2).toBe(storage3);
    });

    it('should only create storage once', async () => {
      const { createInMemoryTokenStorage } = await import('./memory.ts');
      const { getTokenStorage } = await import('./index.ts');

      getTokenStorage();
      getTokenStorage();
      getTokenStorage();

      expect(createInMemoryTokenStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCodeChallengeStorage', () => {
    it('should return a code challenge storage instance', async () => {
      const { getCodeChallengeStorage } = await import('./index.ts');
      const storage = getCodeChallengeStorage();

      expect(storage).toBeDefined();
      expect(storage.store).toBeDefined();
      expect(storage.get).toBeDefined();
      expect(storage.clear).toBeDefined();
    });

    it('should return the same instance on multiple calls (singleton)', async () => {
      const { getCodeChallengeStorage } = await import('./index.ts');
      const storage1 = getCodeChallengeStorage();
      const storage2 = getCodeChallengeStorage();
      const storage3 = getCodeChallengeStorage();

      expect(storage1).toBe(storage2);
      expect(storage2).toBe(storage3);
    });

    it('should only create storage once', async () => {
      const { createInMemoryCodeChallengeStorage } = await import('./memory.ts');
      const { getCodeChallengeStorage } = await import('./index.ts');

      getCodeChallengeStorage();
      getCodeChallengeStorage();
      getCodeChallengeStorage();

      expect(createInMemoryCodeChallengeStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Independent storage instances', () => {
    it('should have separate instances for token and code challenge storage', async () => {
      const { getTokenStorage, getCodeChallengeStorage } = await import('./index.ts');
      const tokenStorage = getTokenStorage();
      const codeChallengeStorage = getCodeChallengeStorage();

      expect(tokenStorage).not.toBe(codeChallengeStorage);
    });

    it('should create both storages independently', async () => {
      const { createInMemoryTokenStorage, createInMemoryCodeChallengeStorage } = await import('./memory.ts');
      const { getTokenStorage, getCodeChallengeStorage } = await import('./index.ts');

      getTokenStorage();
      getCodeChallengeStorage();

      expect(createInMemoryTokenStorage).toHaveBeenCalledTimes(1);
      expect(createInMemoryCodeChallengeStorage).toHaveBeenCalledTimes(1);
    });
  });
});