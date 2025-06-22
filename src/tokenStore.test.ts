import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenStore } from './tokenStore.ts';

// Mock DurableObjectStorage
class MockDurableObjectStorage {
  private data = new Map<string, unknown>();

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return this.data.get(key) as T | undefined;
  }

  async put<T = unknown>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }
}

// Mock DurableObjectState
class MockDurableObjectState {
  storage: MockDurableObjectStorage;

  constructor() {
    this.storage = new MockDurableObjectStorage();
  }
}

describe('tokenStore', () => {
  let mockState: DurableObjectState;

  beforeEach(() => {
    mockState = new MockDurableObjectState() as unknown as DurableObjectState;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('store tokens', () => {
    it('should store tokens successfully', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      };

      const request = new Request('http://internal/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens),
      });

      const response = await tokenStore(mockState, request);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');

      // Verify tokens were stored
      const stored = await mockState.storage.get('tokens');
      expect(stored).toEqual(tokens);
    });

    it('should reject invalid token data', async () => {
      const request = new Request('http://internal/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'only-access' }),
      });

      const response = await tokenStore(mockState, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing required fields');
    });
  });

  describe('get tokens', () => {
    it('should return stored tokens', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        clientId: 'test-client-id',
      };

      await mockState.storage.put('tokens', tokens);

      const request = new Request('http://internal/get');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.accessToken).toBe('test-access-token');
      expect(data.expiresAt).toBe(tokens.expiresAt);
      expect(data.refreshToken).toBe('test-refresh-token'); // Returns full token data
    });

    it('should return null when no tokens stored', async () => {
      const request = new Request('http://internal/get');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeNull();
    });

    it('should return expired tokens without auto-refresh', async () => {
      const expiredTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000, // Already expired
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      await mockState.storage.put('tokens', expiredTokens);

      const request = new Request('http://internal/get');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      // Returns expired token as-is (refresh handled by auth layer)
      expect(data.accessToken).toBe('old-access-token');
      expect(data.expiresAt).toBe(expiredTokens.expiresAt);
    });
  });

  // Refresh functionality moved to auth layer - no longer handled here

  describe('clear tokens', () => {
    it('should clear stored tokens', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        clientId: 'test-client-id',
      };

      await mockState.storage.put('tokens', tokens);

      const request = new Request('http://internal/clear');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Tokens cleared');

      // Verify tokens are deleted
      const stored = await mockState.storage.get('tokens');
      expect(stored).toBeUndefined();
    });
  });

  // Auto-refresh functionality moved to auth layer

  describe('error handling', () => {
    it('should handle storage errors when getting tokens', async () => {
      const mockErrorStorage = {
        ...mockState.storage,
        get: vi.fn().mockRejectedValue(new Error('Storage read error')),
      };
      const errorState = { ...mockState, storage: mockErrorStorage };

      const request = new Request('http://internal/get');
      const response = await tokenStore(errorState as any, request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to load tokens');
      expect(data.type).toBe('NetworkError');
    });

    it('should handle storage errors when storing tokens', async () => {
      const mockErrorStorage = {
        ...mockState.storage,
        put: vi.fn().mockRejectedValue(new Error('Storage write error')),
      };
      const errorState = { ...mockState, storage: mockErrorStorage };

      const request = new Request('http://internal/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiresAt: Date.now() + 3600000,
          tokenType: 'Bearer',
        }),
      });

      const response = await tokenStore(errorState as any, request);

      expect(response.status).toBe(500);
      expect(await response.text()).toContain('Failed to store tokens');
    });

    it('should handle storage errors when clearing tokens', async () => {
      const mockErrorStorage = {
        ...mockState.storage,
        delete: vi.fn().mockRejectedValue(new Error('Storage delete error')),
      };
      const errorState = { ...mockState, storage: mockErrorStorage };

      const request = new Request('http://internal/clear');
      const response = await tokenStore(errorState as any, request);

      expect(response.status).toBe(500);
      expect(await response.text()).toContain('Failed to clear tokens');
    });

    it('should handle unknown routes', async () => {
      const request = new Request('http://internal/unknown');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not found');
    });

    it('should handle JSON parse errors', async () => {
      const request = new Request('http://internal/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle non-Error exceptions', async () => {
      const brokenStorage = {
        get: () => {
          throw 'String error';
        },
      };
      const brokenState = { storage: brokenStorage };

      const request = new Request('http://internal/get');
      const response = await tokenStore(brokenState as any, request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to load tokens: String error');
    });
  });
});
