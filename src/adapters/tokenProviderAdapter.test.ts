import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { createTokenProviderAdapter } from './tokenProviderAdapter.ts';
import { createAuthError, createNetworkError } from '../result.ts';
import type { TokenStorage, StoredToken } from '../types/index.ts';

// Mock auth functions
vi.mock('../auth/index.ts', () => ({
  validateToken: vi.fn(),
  refreshTokenWithRetry: vi.fn(),
}));

describe('TokenProviderAdapter', () => {
  let mockTokenStorage: TokenStorage;
  const clientId = 'test-client-id';
  const userId = 'test-user-id';

  const validToken: StoredToken = {
    accessToken: 'valid-access-token',
    refreshToken: 'valid-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer',
    scope: 'user-read-playback-state',
  };

  const expiredToken: StoredToken = {
    accessToken: 'expired-access-token',
    refreshToken: 'expired-refresh-token',
    expiresAt: Date.now() - 1000, // Already expired
    tokenType: 'Bearer',
    scope: 'user-read-playback-state',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenStorage = {
      get: vi.fn(),
      store: vi.fn(),
      clear: vi.fn(),
    };
  });

  describe('getAccessToken', () => {
    it('should return access token for valid token', async () => {
      const { validateToken } = await import('../auth/index.ts');

      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(true));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('valid-access-token');
      }
      expect(mockTokenStorage.get).toHaveBeenCalledWith(userId);
      expect(validateToken).toHaveBeenCalledWith(validToken, 60);
    });

    it('should return error when no token found', async () => {
      mockTokenStorage.get.mockResolvedValue(ok(null));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toBe('No token found');
      }
    });

    it('should return error when storage fails', async () => {
      mockTokenStorage.get.mockResolvedValue(err(new Error('Storage error')));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Failed to retrieve token from storage');
      }
    });

    it('should refresh expired token with refresh token', async () => {
      const { validateToken, refreshTokenWithRetry } = await import('../auth/index.ts');
      const newToken: StoredToken = {
        ...validToken,
        accessToken: 'new-access-token',
      };

      mockTokenStorage.get.mockResolvedValue(ok(expiredToken));
      mockTokenStorage.store.mockResolvedValue(ok(undefined));
      (validateToken as any).mockReturnValue(ok(false));
      (refreshTokenWithRetry as any).mockResolvedValue(ok(newToken));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('new-access-token');
      }
      expect(refreshTokenWithRetry).toHaveBeenCalledWith('expired-refresh-token', clientId);
      expect(mockTokenStorage.store).toHaveBeenCalledWith(userId, newToken);
    });

    it('should return error when refresh fails', async () => {
      const { validateToken, refreshTokenWithRetry } = await import('../auth/index.ts');

      mockTokenStorage.get.mockResolvedValue(ok(expiredToken));
      (validateToken as any).mockReturnValue(ok(false));
      (refreshTokenWithRetry as any).mockResolvedValue(
        err(createAuthError('Refresh failed', 'invalid')),
      );

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toBe('Refresh failed');
      }
    });

    it('should return error when token expired and no refresh token', async () => {
      const { validateToken } = await import('../auth/index.ts');
      const tokenWithoutRefresh: StoredToken = {
        ...expiredToken,
        refreshToken: '',
      };

      mockTokenStorage.get.mockResolvedValue(ok(tokenWithoutRefresh));
      (validateToken as any).mockReturnValue(ok(false));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.getAccessToken();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toBe('Token expired and no refresh token available');
      }
    });
  });

  describe('refreshTokenIfNeeded', () => {
    it('should behave the same as getAccessToken', async () => {
      const { validateToken } = await import('../auth/index.ts');

      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(true));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId, userId);
      const result = await adapter.refreshTokenIfNeeded();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('valid-access-token');
      }
    });
  });

  describe('custom userId', () => {
    it('should use default userId when not provided', async () => {
      const { validateToken } = await import('../auth/index.ts');

      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(true));

      const adapter = createTokenProviderAdapter(mockTokenStorage, clientId);
      await adapter.getAccessToken();

      expect(mockTokenStorage.get).toHaveBeenCalledWith('default-user');
    });
  });
});
