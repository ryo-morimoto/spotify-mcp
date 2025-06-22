import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeTokenResponse,
  isTokenExpired,
  getSecondsUntilExpiry,
  hasRefreshToken,
  type SpotifyTokenResponse,
  type SpotifyRefreshResponse,
  type StoredToken,
} from './token.ts';

describe('Token Types and Utilities', () => {
  let dateNowSpy: any;
  const mockNow = 1700000000000; // Fixed timestamp for testing

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('normalizeTokenResponse', () => {
    it('should normalize full token response', () => {
      const response: SpotifyTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state user-modify-playback-state',
      };

      const result = normalizeTokenResponse(response);

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: mockNow + 3600000, // 1 hour from now
        tokenType: 'Bearer',
        scope: 'user-read-playback-state user-modify-playback-state',
      });
    });

    it('should handle refresh response without refresh token', () => {
      const response: SpotifyRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state',
        // No refresh_token in response
      };

      const result = normalizeTokenResponse(response);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: undefined,
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      });
    });

    it('should use existing refresh token when not in response', () => {
      const response: SpotifyRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state',
      };

      const result = normalizeTokenResponse(response, 'existing-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'existing-refresh-token',
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
      });
    });

    it('should prefer new refresh token over existing', () => {
      const response: SpotifyTokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state',
      };

      const result = normalizeTokenResponse(response, 'old-refresh-token');

      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should handle different expires_in values', () => {
      const response: SpotifyTokenResponse = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 7200, // 2 hours
        token_type: 'Bearer',
        scope: 'streaming',
      };

      const result = normalizeTokenResponse(response);

      expect(result.expiresAt).toBe(mockNow + 7200000); // 2 hours in ms
    });

    it('should handle zero expires_in', () => {
      const response: SpotifyTokenResponse = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 0,
        token_type: 'Bearer',
        scope: 'streaming',
      };

      const result = normalizeTokenResponse(response);

      expect(result.expiresAt).toBe(mockNow); // Already expired
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 3600000, // 1 hour from now
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow - 1000, // 1 second ago
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should apply default 60 second buffer', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 30000, // 30 seconds from now
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token)).toBe(true); // Within 60 second buffer
    });

    it('should apply custom buffer', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 30000, // 30 seconds from now
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token, 10)).toBe(false); // Outside 10 second buffer
      expect(isTokenExpired(token, 40)).toBe(true); // Within 40 second buffer
    });

    it('should handle zero buffer', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 1000, // 1 second from now
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token, 0)).toBe(false);
    });

    it('should handle exactly expired token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow,
        tokenType: 'Bearer',
      };

      expect(isTokenExpired(token, 0)).toBe(true);
    });
  });

  describe('getSecondsUntilExpiry', () => {
    it('should calculate seconds until expiry', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 3600000, // 1 hour from now
        tokenType: 'Bearer',
      };

      expect(getSecondsUntilExpiry(token)).toBe(3600);
    });

    it('should return 0 for expired token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow - 1000, // 1 second ago
        tokenType: 'Bearer',
      };

      expect(getSecondsUntilExpiry(token)).toBe(0);
    });

    it('should handle partial seconds', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 1500, // 1.5 seconds from now
        tokenType: 'Bearer',
      };

      expect(getSecondsUntilExpiry(token)).toBe(1); // Floor to 1
    });

    it('should handle exactly expired token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow,
        tokenType: 'Bearer',
      };

      expect(getSecondsUntilExpiry(token)).toBe(0);
    });

    it('should handle large expiry times', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: mockNow + 86400000, // 24 hours from now
        tokenType: 'Bearer',
      };

      expect(getSecondsUntilExpiry(token)).toBe(86400);
    });
  });

  describe('hasRefreshToken', () => {
    it('should return true for token with valid refresh token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
      };

      expect(hasRefreshToken(token)).toBe(true);
    });

    it('should return false for token without refresh token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
      };

      expect(hasRefreshToken(token)).toBe(false);
    });

    it('should return false for empty refresh token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: '',
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
      };

      expect(hasRefreshToken(token)).toBe(false);
    });

    it('should return false for undefined refresh token', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: undefined,
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
      };

      expect(hasRefreshToken(token)).toBe(false);
    });

    it('should work as type guard', () => {
      const token: StoredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: mockNow + 3600000,
        tokenType: 'Bearer',
      };

      if (hasRefreshToken(token)) {
        // TypeScript should know refreshToken is string here
        expect(token.refreshToken.length).toBeGreaterThan(0);
      }
    });
  });
});
