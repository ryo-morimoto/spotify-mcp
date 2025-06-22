import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exchangeCodeForToken,
  refreshToken,
  validateToken,
  refreshTokenWithRetry,
} from './tokens.ts';
import { normalizeTokenResponse } from '../types/index.ts';

// Mock fetch globally
global.fetch = vi.fn();

// Mock normalizeTokenResponse
vi.mock('../types/index.ts', () => ({
  normalizeTokenResponse: vi.fn((response, existingRefreshToken) => ({
    accessToken: response.access_token,
    refreshToken: response.refresh_token || existingRefreshToken || '',
    tokenType: response.token_type || 'Bearer',
    expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
    scope: response.scope || '',
  })),
}));

// Mock retry module
vi.mock('./retry.ts', () => ({
  withExponentialBackoff: vi.fn((fn, _options) => fn()),
}));

describe('Token Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('exchangeCodeForToken', () => {
    const code = 'test-auth-code';
    const codeVerifier = 'test-verifier';
    const clientId = 'test-client-id';
    const redirectUri = 'http://localhost:8000/callback';

    it('should successfully exchange code for tokens', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user-read-playback-state',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe('test-access-token');
        expect(result.value.refreshToken).toBe('test-refresh-token');
      }

      expect(global.fetch).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.stringContaining('grant_type=authorization_code'),
      });
    });

    it('should handle invalid grant error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      });

      const result = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('Invalid authorization code');
        expect((result.error as any).reason).toBe('invalid');
      }
    });

    it('should handle generic HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'server_error' }),
      });

      const result = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('500 Internal Server Error');
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Network error');
      }
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as any).mockRejectedValue('Unknown error');

      const result = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Network error during token exchange');
      }
    });
  });

  describe('refreshToken', () => {
    const refreshTokenStr = 'test-refresh-token';
    const clientId = 'test-client-id';

    it('should successfully refresh token', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user-read-playback-state',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await refreshToken(refreshTokenStr, clientId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe('new-access-token');
        expect(result.value.refreshToken).toBe('test-refresh-token'); // Should keep existing
      }

      expect(global.fetch).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.stringContaining('grant_type=refresh_token'),
      });
    });

    it('should handle expired refresh token', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      });

      const result = await refreshToken(refreshTokenStr, clientId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('Refresh token expired');
        expect((result.error as any).reason).toBe('expired');
      }
    });

    it('should handle generic HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'forbidden' }),
      });

      const result = await refreshToken(refreshTokenStr, clientId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('403 Forbidden');
        expect((result.error as any).reason).toBe('invalid');
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Connection refused'));

      const result = await refreshToken(refreshTokenStr, clientId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Connection refused');
      }
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as any).mockRejectedValue(null);

      const result = await refreshToken(refreshTokenStr, clientId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Network error during token refresh');
      }
    });
  });

  describe('validateToken', () => {
    it('should validate non-expired token', () => {
      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      const result = validateToken(tokens);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should invalidate expired token', () => {
      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      const result = validateToken(tokens);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should apply buffer time', () => {
      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 30000, // 30 seconds from now
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      // With default 60 second buffer, should be invalid
      const result1 = validateToken(tokens);
      expect(result1.isOk()).toBe(true);
      if (result1.isOk()) {
        expect(result1.value).toBe(false);
      }

      // With 10 second buffer, should be valid
      const result2 = validateToken(tokens, 10);
      expect(result2.isOk()).toBe(true);
      if (result2.isOk()) {
        expect(result2.value).toBe(true);
      }
    });

    it('should handle zero buffer', () => {
      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 1000, // 1 second from now
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      const result = validateToken(tokens, 0);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe('refreshTokenWithRetry', () => {
    const refreshTokenStr = 'test-refresh-token';
    const clientId = 'test-client-id';

    it('should call withExponentialBackoff with correct parameters', async () => {
      const { withExponentialBackoff } = await import('./retry.ts');
      const mockTokens = {
        accessToken: 'new-token',
        refreshToken: refreshTokenStr,
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      };

      (withExponentialBackoff as any).mockResolvedValue({ isOk: () => true, value: mockTokens });

      const result = await refreshTokenWithRetry(refreshTokenStr, clientId);

      expect(result.isOk()).toBe(true);
      expect(withExponentialBackoff).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          shouldRetry: expect.any(Function),
        }),
      );
    });

    it('should use custom maxRetries', async () => {
      const { withExponentialBackoff } = await import('./retry.ts');

      await refreshTokenWithRetry(refreshTokenStr, clientId, 5);

      expect(withExponentialBackoff).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 5,
        }),
      );
    });

    it('should not retry on invalid auth errors', async () => {
      const { withExponentialBackoff } = await import('./retry.ts');

      // Get the shouldRetry function from the call
      await refreshTokenWithRetry(refreshTokenStr, clientId);
      const callArgs = (withExponentialBackoff as any).mock.calls[0];
      const options = callArgs[1];
      const shouldRetry = options.shouldRetry;

      // Test that invalid auth errors should not retry
      const authError = { type: 'AuthError', reason: 'invalid', message: 'Invalid token' };
      expect(shouldRetry(authError, 1)).toBe(false);
    });

    it('should retry on network errors', async () => {
      const { withExponentialBackoff } = await import('./retry.ts');

      await refreshTokenWithRetry(refreshTokenStr, clientId);
      const callArgs = (withExponentialBackoff as any).mock.calls[0];
      const options = callArgs[1];
      const shouldRetry = options.shouldRetry;

      // Test that network errors should retry
      const networkError = { type: 'NetworkError', message: 'Network failed' };
      expect(shouldRetry(networkError, 1)).toBe(true);
    });

    it('should retry on expired auth errors', async () => {
      const { withExponentialBackoff } = await import('./retry.ts');

      await refreshTokenWithRetry(refreshTokenStr, clientId);
      const callArgs = (withExponentialBackoff as any).mock.calls[0];
      const options = callArgs[1];
      const shouldRetry = options.shouldRetry;

      // Test that expired auth errors should retry
      const expiredError = { type: 'AuthError', reason: 'expired', message: 'Token expired' };
      expect(shouldRetry(expiredError, 1)).toBe(true);
    });
  });
});
