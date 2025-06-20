import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenStore } from './tokenStore.ts';
import * as oauthHandler from './oauthHandler.ts';
import { ok, err } from 'neverthrow';

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
      expect(data.refreshToken).toBeUndefined(); // Should not expose refresh token
    });

    it('should return 401 when no tokens stored', async () => {
      const request = new Request('http://internal/get');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(401);
      const error = (await response.json()) as any;
      expect(error.type).toBe('AuthError');
    });

    it('should auto-refresh expired tokens', async () => {
      const mockRefresh = vi.spyOn(oauthHandler, 'refreshToken').mockResolvedValue(
        ok({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          scope: 'user-read-playback-state',
          expiresAt: Date.now() + 3600000,
        }),
      );

      const expiredTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000, // Already expired
        clientId: 'test-client-id',
      };

      await mockState.storage.put('tokens', expiredTokens);

      const request = new Request('http://internal/get');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      expect(mockRefresh).toHaveBeenCalledWith('test-refresh-token', 'test-client-id');

      const data = (await response.json()) as any;
      expect(data.accessToken).toBe('new-access-token');
    });
  });

  describe('refresh tokens', () => {
    it('should refresh tokens manually', async () => {
      const mockRefresh = vi.spyOn(oauthHandler, 'refreshToken').mockResolvedValue(
        ok({
          accessToken: 'refreshed-access-token',
          refreshToken: 'refreshed-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          scope: 'user-read-playback-state',
          expiresAt: Date.now() + 3600000,
        }),
      );

      const tokens = {
        accessToken: 'old-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 300000, // 5 minutes left
        clientId: 'test-client-id',
      };

      await mockState.storage.put('tokens', tokens);

      const request = new Request('http://internal/refresh');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Token refreshed');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle refresh failure', async () => {
      vi.spyOn(oauthHandler, 'refreshToken').mockResolvedValue(
        err({
          type: 'NetworkError' as const,
          message: 'Failed to refresh token',
        }),
      );

      const tokens = {
        accessToken: 'old-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 300000,
        clientId: 'test-client-id',
      };

      await mockState.storage.put('tokens', tokens);

      const request = new Request('http://internal/refresh');
      const response = await tokenStore(mockState, request);

      expect(response.status).toBe(500);
      const error = (await response.json()) as any;
      expect(error.error).toBe('Refresh failed');
    });
  });

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

  describe('auto-refresh timer', () => {
    it('should set up auto-refresh timer', async () => {
      const futureTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: futureTime,
        clientId: 'test-client-id',
      };

      const request = new Request('http://internal/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens),
      });

      const mockRefresh = vi.spyOn(oauthHandler, 'refreshToken').mockResolvedValue(
        ok({
          accessToken: 'auto-refreshed-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          scope: 'user-read-playback-state',
          expiresAt: Date.now() + 3600000,
        }),
      );

      await tokenStore(mockState, request);

      // Fast-forward to 5 minutes before expiry
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Wait for async refresh
      await vi.runAllTimersAsync();

      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
