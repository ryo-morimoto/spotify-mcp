import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { oauthRoutes } from './oauth.ts';
import { ok, err } from 'neverthrow';
import { createNetworkError, createAuthError } from '../result.ts';
import type { StoredToken } from '../types/index.ts';

// Mock auth module
vi.mock('../auth/index.ts', () => ({
  generateCodeChallenge: vi.fn(),
  generateAuthUrl: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  handleOAuthCallback: vi.fn(),
  buildScopeString: vi.fn().mockReturnValue('user-read-playback-state user-modify-playback-state user-read-currently-playing'),
  parseScopeString: vi.fn().mockImplementation((s: string) => s.split(' ')),
  hasRequiredScopes: vi.fn().mockReturnValue(true),
}));

describe('OAuth routes', () => {
  let app: Hono;
  let mockCodeChallengeStorage: any;
  let mockTokenStorage: any;
  let mockConfig: any;

  beforeEach(() => {
    app = new Hono();
    
    // Setup mock storage
    mockCodeChallengeStorage = {
      store: vi.fn().mockResolvedValue(ok(undefined)),
      get: vi.fn(),
      clear: vi.fn().mockResolvedValue(ok(undefined)),
    };
    
    mockTokenStorage = {
      store: vi.fn().mockResolvedValue(ok(undefined)),
      get: vi.fn(),
      clear: vi.fn(),
    };
    
    mockConfig = {
      spotifyClientId: 'test-client-id',
      spotifyClientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:8000/callback',
    };
    
    // Add middleware to provide context
    app.use('*', async (c, next) => {
      c.set('codeChallengeStorage', mockCodeChallengeStorage);
      c.set('tokenStorage', mockTokenStorage);
      c.set('config', mockConfig);
      c.set('userId', 'test-user-id');
      await next();
    });
    
    app.route('/', oauthRoutes);
  });

  describe('GET /auth', () => {
    it('should redirect to Spotify authorization URL', async () => {
      const { generateCodeChallenge, generateAuthUrl } = await import('../auth/index.ts');
      
      const mockPkce = {
        codeChallenge: 'test-challenge',
        codeVerifier: 'test-verifier',
      };
      
      (generateCodeChallenge as any).mockResolvedValue(ok(mockPkce));
      (generateAuthUrl as any).mockReturnValue(ok('https://accounts.spotify.com/authorize?...'));
      
      const response = await app.request('/auth');
      
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('https://accounts.spotify.com/authorize?...');
      expect(mockCodeChallengeStorage.store).toHaveBeenCalled();
    });

    it('should handle PKCE generation failure', async () => {
      const { generateCodeChallenge } = await import('../auth/index.ts');
      (generateCodeChallenge as any).mockResolvedValue(err(createNetworkError('PKCE failed')));
      
      const response = await app.request('/auth');
      const body = await response.json() as any;
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to generate PKCE challenge');
    });

    it('should handle storage failure', async () => {
      const { generateCodeChallenge } = await import('../auth/index.ts');
      
      const mockPkce = {
        codeChallenge: 'test-challenge',
        codeVerifier: 'test-verifier',
      };
      
      (generateCodeChallenge as any).mockResolvedValue(ok(mockPkce));
      mockCodeChallengeStorage.store.mockResolvedValue(err(createNetworkError('Storage failed')));
      
      const response = await app.request('/auth');
      const body = await response.json() as any;
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to store PKCE challenge');
    });

    it('should handle auth URL generation failure', async () => {
      const { generateCodeChallenge, generateAuthUrl } = await import('../auth/index.ts');
      
      const mockPkce = {
        codeChallenge: 'test-challenge',
        codeVerifier: 'test-verifier',
      };
      
      (generateCodeChallenge as any).mockResolvedValue(ok(mockPkce));
      (generateAuthUrl as any).mockReturnValue(err(createNetworkError('URL generation failed')));
      
      const response = await app.request('/auth');
      const body = await response.json() as any;
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to generate auth URL');
    });
  });

  describe('GET /callback', () => {
    const mockPkce = {
      codeChallenge: 'test-challenge',
      codeVerifier: 'test-verifier',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    const mockTokens: StoredToken = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600 * 1000,
      scope: 'user-read-playback-state user-modify-playback-state user-read-currently-playing',
      tokenType: 'Bearer',
    };

    beforeEach(() => {
      mockCodeChallengeStorage.get.mockResolvedValue(ok(mockPkce));
    });

    it('should exchange code for tokens successfully', async () => {
      const { handleOAuthCallback } = await import('../auth/index.ts');
      (handleOAuthCallback as any).mockResolvedValue(ok(mockTokens));
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(body).toContain('Authentication Successful!');
      expect(mockTokenStorage.store).toHaveBeenCalledWith('test-user-id', mockTokens);
      expect(mockCodeChallengeStorage.clear).toHaveBeenCalledWith('test-state');
    });

    it('should handle error parameter from Spotify', async () => {
      const response = await app.request('/callback?error=access_denied');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('access_denied');
    });

    it('should handle missing code parameter', async () => {
      const response = await app.request('/callback?state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('No authorization code received');
    });

    it('should handle missing state parameter', async () => {
      const response = await app.request('/callback?code=test-code');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('No state parameter received');
    });

    it('should handle PKCE retrieval failure', async () => {
      mockCodeChallengeStorage.get.mockResolvedValue(err(createNetworkError('Storage failed')));
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to retrieve PKCE challenge');
    });

    it('should handle missing PKCE challenge', async () => {
      mockCodeChallengeStorage.get.mockResolvedValue(ok(null));
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('PKCE challenge not found or expired');
    });

    it('should handle token exchange failure', async () => {
      const { handleOAuthCallback } = await import('../auth/index.ts');
      (handleOAuthCallback as any).mockResolvedValue(
        err(createAuthError('Invalid authorization code', 'invalid'))
      );
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid authorization code');
    });

    it('should handle missing required scopes', async () => {
      const { handleOAuthCallback, hasRequiredScopes } = await import('../auth/index.ts');
      
      const limitedTokens = {
        ...mockTokens,
        scope: 'user-read-playback-state', // Missing required scopes
      };
      
      (handleOAuthCallback as any).mockResolvedValue(ok(limitedTokens));
      (hasRequiredScopes as any).mockReturnValue(false);
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Authorization did not grant all required scopes');
      expect(body.missing_scopes).toEqual(['user-read-playback-state']);
    });

    it('should handle token storage failure', async () => {
      const { handleOAuthCallback, hasRequiredScopes } = await import('../auth/index.ts');
      (handleOAuthCallback as any).mockResolvedValue(ok(mockTokens));
      (hasRequiredScopes as any).mockReturnValue(true); // Ensure scopes are valid
      mockTokenStorage.store.mockResolvedValue(err(createNetworkError('Storage failed')));
      
      const response = await app.request('/callback?code=test-code&state=test-state');
      const body = await response.json() as any;
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to store tokens');
    });
  });
});