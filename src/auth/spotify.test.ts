import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { handleOAuthCallback } from './spotify.ts';
import { createAuthError, createNetworkError } from '../result.ts';
import type { OAuthTokens } from '../types/index.ts';

// Mock the tokens module
vi.mock('./tokens.ts', () => ({
  exchangeCodeForToken: vi.fn(),
}));

describe('Spotify OAuth', () => {
  const mockTokens: OAuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600 * 1000,
    scope: 'user-read-playback-state user-modify-playback-state',
    tokenType: 'Bearer',
  };

  describe('handleOAuthCallback', () => {
    it('should exchange code for tokens successfully', async () => {
      const { exchangeCodeForToken } = await import('./tokens.ts');
      (exchangeCodeForToken as any).mockResolvedValue(ok(mockTokens));
      
      const result = await handleOAuthCallback(
        'test-code',
        'test-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
      );
      
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTokens);
      expect(exchangeCodeForToken).toHaveBeenCalledWith(
        'test-code',
        'test-verifier',
        'client-id',
        'http://localhost:8000/callback',
      );
    });

    it('should validate state parameter when expected state is provided', async () => {
      const { exchangeCodeForToken } = await import('./tokens.ts');
      (exchangeCodeForToken as any).mockResolvedValue(ok(mockTokens));
      
      const result = await handleOAuthCallback(
        'test-code',
        'valid-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
        'valid-state', // Expected state matches
      );
      
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTokens);
    });

    it('should reject mismatched state parameter', async () => {
      const result = await handleOAuthCallback(
        'test-code',
        'invalid-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
        'expected-state', // Expected state doesn't match
      );
      
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.message).toBe('Invalid state parameter - possible CSRF attack');
      expect(error.type).toBe('AuthError');
      expect((error as any).reason).toBe('invalid');
    });

    it('should skip state validation when expected state is not provided', async () => {
      const { exchangeCodeForToken } = await import('./tokens.ts');
      (exchangeCodeForToken as any).mockResolvedValue(ok(mockTokens));
      
      const result = await handleOAuthCallback(
        'test-code',
        'any-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
        // No expected state provided
      );
      
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTokens);
    });

    it('should propagate token exchange errors', async () => {
      const { exchangeCodeForToken } = await import('./tokens.ts');
      const networkError = createNetworkError('Token exchange failed');
      (exchangeCodeForToken as any).mockResolvedValue(err(networkError));
      
      const result = await handleOAuthCallback(
        'test-code',
        'test-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
      );
      
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(networkError);
    });

    it('should propagate auth errors from token exchange', async () => {
      const { exchangeCodeForToken } = await import('./tokens.ts');
      const authError = createAuthError('Invalid authorization code', 'invalid');
      (exchangeCodeForToken as any).mockResolvedValue(err(authError));
      
      const result = await handleOAuthCallback(
        'invalid-code',
        'test-state',
        'client-id',
        'client-secret',
        'http://localhost:8000/callback',
        'test-verifier',
      );
      
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(authError);
    });
  });
});