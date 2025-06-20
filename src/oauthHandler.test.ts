import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateCodeChallenge, 
  generateAuthUrl,
  exchangeCodeForToken, 
  refreshToken, 
  validateToken,
  type OAuthTokens,
  type PKCEChallenge
} from './oauthHandler.ts';

describe('oauthHandler', () => {
  const mockClientId = 'test-client-id';
  const mockRedirectUri = 'http://localhost:3000/callback';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCodeChallenge', () => {
    it('should create valid PKCE challenge', async () => {
      const result = await generateCodeChallenge();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const challenge = result.value;
        expect(challenge.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]{43,128}$/);
        expect(challenge.codeChallenge).toMatch(/^[A-Za-z0-9\-_]{43}$/);
        expect(challenge.challengeMethod).toBe('S256');
      }
    });

    it('should generate different challenges each time', async () => {
      const result1 = await generateCodeChallenge();
      const result2 = await generateCodeChallenge();
      
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.codeVerifier).not.toBe(result2.value.codeVerifier);
        expect(result1.value.codeChallenge).not.toBe(result2.value.codeChallenge);
      }
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL', async () => {
      const pkceResult = await generateCodeChallenge();
      expect(pkceResult.isOk()).toBe(true);
      
      if (pkceResult.isOk()) {
        const scopes = ['user-read-playback-state', 'user-modify-playback-state'];
        const result = generateAuthUrl(mockClientId, mockRedirectUri, pkceResult.value, scopes);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const url = new URL(result.value);
          expect(url.hostname).toBe('accounts.spotify.com');
          expect(url.pathname).toBe('/authorize');
          expect(url.searchParams.get('client_id')).toBe(mockClientId);
          expect(url.searchParams.get('response_type')).toBe('code');
          expect(url.searchParams.get('redirect_uri')).toBe(mockRedirectUri);
          expect(url.searchParams.get('code_challenge')).toBe(pkceResult.value.codeChallenge);
          expect(url.searchParams.get('code_challenge_method')).toBe('S256');
          expect(url.searchParams.get('scope')).toBe(scopes.join(' '));
        }
      }
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should return tokens on success', async () => {
      const mockTokens: OAuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
        expiresAt: Date.now() + 3600 * 1000
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockTokens.accessToken,
          refresh_token: mockTokens.refreshToken,
          expires_in: mockTokens.expiresIn,
          token_type: mockTokens.tokenType,
          scope: mockTokens.scope
        })
      });

      const result = await exchangeCodeForToken(
        'auth-code',
        'code-verifier',
        mockClientId,
        mockRedirectUri
      );
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe(mockTokens.accessToken);
        expect(result.value.refreshToken).toBe(mockTokens.refreshToken);
        expect(result.value.expiresIn).toBe(mockTokens.expiresIn);
        expect(result.value.tokenType).toBe(mockTokens.tokenType);
        expect(result.value.expiresAt).toBeGreaterThan(Date.now());
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: expect.stringContaining('grant_type=authorization_code')
        })
      );
    });

    it('should handle invalid authorization code', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' })
      });

      const result = await exchangeCodeForToken(
        'invalid-code',
        'code-verifier',
        mockClientId,
        mockRedirectUri
      );
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('Token exchange failed');
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await exchangeCodeForToken(
        'auth-code',
        'code-verifier',
        mockClientId,
        mockRedirectUri
      );
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
      }
    });
  });

  describe('refreshToken', () => {
    it('should update access token', async () => {
      const mockNewToken = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewToken
      });

      const result = await refreshToken('mock-refresh-token', mockClientId);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe(mockNewToken.access_token);
        expect(result.value.expiresIn).toBe(mockNewToken.expires_in);
        expect(result.value.refreshToken).toBe('mock-refresh-token');
        expect(result.value.expiresAt).toBeGreaterThan(Date.now());
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: expect.stringContaining('grant_type=refresh_token')
        })
      );
    });

    it('should handle expired refresh token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' })
      });

      const result = await refreshToken('expired-refresh-token', mockClientId);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.reason).toBe('expired');
      }
    });
  });

  describe('validateToken', () => {
    it('should check token expiry', () => {
      const validToken: OAuthTokens = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
        expiresAt: Date.now() + 3600 * 1000
      };

      const result = validateToken(validToken);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should detect expired token', () => {
      const expiredToken: OAuthTokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      const result = validateToken(expiredToken);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should add buffer time for token validation', () => {
      const almostExpiredToken: OAuthTokens = {
        accessToken: 'almost-expired-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'user-read-playback-state',
        expiresAt: Date.now() + 30 * 1000 // Expires in 30 seconds
      };

      const result = validateToken(almostExpiredToken, 60); // 60 second buffer
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false); // Should be considered expired with buffer
      }
    });
  });
});