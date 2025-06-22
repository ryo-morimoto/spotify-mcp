import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCodeChallenge, generateAuthUrl } from './pkce.ts';
import { randomBytes, createHash } from 'crypto';

// Mock crypto module
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

describe('PKCE Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCodeChallenge', () => {
    it('should generate valid PKCE challenge', async () => {
      // Mock randomBytes to return a known buffer
      const mockBuffer = Buffer.from('test-random-bytes-for-pkce-challenge');
      (randomBytes as any).mockReturnValue(mockBuffer);

      // Mock createHash to return a known hash
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(Buffer.from('test-hash-result')),
      };
      (createHash as any).mockReturnValue(mockHash);

      const result = await generateCodeChallenge();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.codeVerifier).toBe('dGVzdC1yYW5kb20tYnl0ZXMtZm9yLXBrY2UtY2hhbGxlbmdl');
        expect(result.value.codeChallenge).toBe('dGVzdC1oYXNoLXJlc3VsdA');
        expect(result.value.challengeMethod).toBe('S256');
      }

      expect(randomBytes).toHaveBeenCalledWith(32);
      expect(createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('dGVzdC1yYW5kb20tYnl0ZXMtZm9yLXBrY2UtY2hhbGxlbmdl');
    });

    it('should handle base64 URL encoding correctly', async () => {
      // Mock buffer with characters that need URL encoding
      const mockBuffer = Buffer.from([255, 254, 253, 252, 251, 250, 249, 248]);
      (randomBytes as any).mockReturnValue(mockBuffer);

      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(Buffer.from([0, 1, 2, 3, 4, 5])),
      };
      (createHash as any).mockReturnValue(mockHash);

      const result = await generateCodeChallenge();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Check that +, /, and = are replaced
        expect(result.value.codeVerifier).not.toContain('+');
        expect(result.value.codeVerifier).not.toContain('/');
        expect(result.value.codeVerifier).not.toContain('=');
        expect(result.value.codeChallenge).not.toContain('+');
        expect(result.value.codeChallenge).not.toContain('/');
        expect(result.value.codeChallenge).not.toContain('=');
      }
    });

    it('should handle crypto errors', async () => {
      (randomBytes as any).mockImplementation(() => {
        throw new Error('Crypto error');
      });

      const result = await generateCodeChallenge();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Crypto error');
      }
    });

    it('should handle non-Error exceptions', async () => {
      (randomBytes as any).mockImplementation(() => {
        throw 'Unknown crypto error';
      });

      const result = await generateCodeChallenge();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Failed to generate PKCE challenge');
      }
    });
  });

  describe('generateAuthUrl', () => {
    const clientId = 'test-client-id';
    const redirectUri = 'http://localhost:8000/callback';
    const pkceChallenge = {
      codeVerifier: 'test-verifier',
      codeChallenge: 'test-challenge',
      challengeMethod: 'S256' as const,
    };
    const scopes = ['user-read-playback-state', 'user-modify-playback-state'];

    it('should generate auth URL without state', () => {
      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, scopes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const url = new URL(result.value);
        expect(url.origin).toBe('https://accounts.spotify.com');
        expect(url.pathname).toBe('/authorize');
        expect(url.searchParams.get('client_id')).toBe(clientId);
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
        expect(url.searchParams.get('code_challenge')).toBe('test-challenge');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('scope')).toBe('user-read-playback-state user-modify-playback-state');
        expect(url.searchParams.has('state')).toBe(false);
      }
    });

    it('should generate auth URL with state', () => {
      const state = 'test-state-123';
      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, scopes, state);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const url = new URL(result.value);
        expect(url.searchParams.get('state')).toBe(state);
      }
    });

    it('should handle empty scopes array', () => {
      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, []);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const url = new URL(result.value);
        expect(url.searchParams.get('scope')).toBe('');
      }
    });

    it('should handle special characters in parameters', () => {
      const specialRedirectUri = 'http://localhost:8000/callback?param=value&other=test';
      const specialState = 'state with spaces & special=characters';
      
      const result = generateAuthUrl(clientId, specialRedirectUri, pkceChallenge, scopes, specialState);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const url = new URL(result.value);
        // URL constructor should properly encode these
        expect(url.searchParams.get('redirect_uri')).toBe(specialRedirectUri);
        expect(url.searchParams.get('state')).toBe(specialState);
      }
    });

    it('should handle URL constructor errors', () => {
      // Mock URL constructor to throw
      const originalURL = global.URL;
      global.URL = vi.fn().mockImplementation(() => {
        throw new Error('Invalid URL');
      }) as any;

      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, scopes);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Invalid URL');
      }

      // Restore original URL
      global.URL = originalURL;
    });

    it('should handle non-Error exceptions in URL generation', () => {
      // Mock URL constructor to throw non-Error
      const originalURL = global.URL;
      global.URL = vi.fn().mockImplementation(() => {
        throw 'URL error';
      }) as any;

      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, scopes);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Failed to generate auth URL');
      }

      // Restore original URL
      global.URL = originalURL;
    });

    it('should maintain parameter order for consistency', () => {
      const result = generateAuthUrl(clientId, redirectUri, pkceChallenge, scopes, 'state123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Check that all required params are present
        const url = new URL(result.value);
        const params = Array.from(url.searchParams.keys());
        expect(params).toContain('client_id');
        expect(params).toContain('response_type');
        expect(params).toContain('redirect_uri');
        expect(params).toContain('code_challenge');
        expect(params).toContain('code_challenge_method');
        expect(params).toContain('scope');
        expect(params).toContain('state');
      }
    });
  });
});