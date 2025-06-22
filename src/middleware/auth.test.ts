import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, requireAuth, optionalAuth, requireScopes } from './auth.ts';
import { ok, err } from 'neverthrow';
import { createAuthError } from '../result.ts';
import type { StoredToken } from '../types/index.ts';

// Mock storage module
vi.mock('../storage/index.ts', () => ({
  getTokenStorage: vi.fn(),
}));

// Mock auth module
vi.mock('../auth/index.ts', () => ({
  validateToken: vi.fn(),
  parseScopeString: vi.fn().mockImplementation((s: string) => s.split(' ')),
  hasRequiredScopes: vi.fn(),
}));

describe('Auth middleware', () => {
  let app: Hono;
  let mockTokenStorage: any;

  const validToken: StoredToken = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600 * 1000,
    scope: 'user-read-playback-state user-modify-playback-state',
    tokenType: 'Bearer',
  };

  beforeEach(async () => {
    app = new Hono();
    
    mockTokenStorage = {
      get: vi.fn(),
      store: vi.fn(),
      clear: vi.fn(),
    };
    
    const { getTokenStorage } = vi.mocked(await import('../storage/index.ts'));
    getTokenStorage.mockReturnValue(mockTokenStorage);
  });

  describe('authMiddleware', () => {
    it('should set authenticated to true for valid tokens', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(validToken));
      
      app.use('*', authMiddleware);
      app.get('/test', (c) => {
        return c.json({
          userId: c.get('userId'),
          authenticated: c.get('authenticated'),
          hasTokens: !!c.get('tokens'),
        });
      });
      
      const response = await app.request('/test');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.userId).toBe('default-user');
      expect(body.authenticated).toBe(true);
      expect(body.hasTokens).toBe(true);
    });

    it('should set authenticated to false for no tokens', async () => {
      mockTokenStorage.get.mockResolvedValue(ok(null));
      
      app.use('*', authMiddleware);
      app.get('/test', (c) => {
        return c.json({
          authenticated: c.get('authenticated'),
          hasTokens: !!c.get('tokens'),
        });
      });
      
      const response = await app.request('/test');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.authenticated).toBe(false);
      expect(body.hasTokens).toBe(false);
    });

    it('should set authenticated to false for expired tokens', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      const expiredToken = { ...validToken, expiresAt: Date.now() - 1000 };
      mockTokenStorage.get.mockResolvedValue(ok(expiredToken));
      (validateToken as any).mockReturnValue(err(createAuthError('Token expired', 'expired')));
      
      app.use('*', authMiddleware);
      app.get('/test', (c) => {
        return c.json({
          authenticated: c.get('authenticated'),
          hasTokens: !!c.get('tokens'),
        });
      });
      
      const response = await app.request('/test');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.authenticated).toBe(false);
      expect(body.hasTokens).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      mockTokenStorage.get.mockResolvedValue(err(new Error('Storage error')));
      
      app.use('*', authMiddleware);
      app.get('/test', (c) => {
        return c.json({
          authenticated: c.get('authenticated'),
        });
      });
      
      const response = await app.request('/test');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.authenticated).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should allow access when authenticated', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(validToken));
      
      app.use('*', authMiddleware);
      app.get('/protected', requireAuth, (c) => {
        return c.json({ message: 'Access granted' });
      });
      
      const response = await app.request('/protected');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.message).toBe('Access granted');
    });

    it('should deny access when not authenticated', async () => {
      mockTokenStorage.get.mockResolvedValue(ok(null));
      
      app.use('*', authMiddleware);
      app.get('/protected', requireAuth, (c) => {
        return c.json({ message: 'Access granted' });
      });
      
      const response = await app.request('/protected');
      const body = await response.json() as any;
      
      expect(response.status).toBe(401);
      expect(body.error).toBe('Not authenticated. Please visit /auth first.');
    });
  });

  describe('optionalAuth', () => {
    it('should proceed regardless of auth status', async () => {
      mockTokenStorage.get.mockResolvedValue(ok(null));
      
      app.use('*', authMiddleware);
      app.get('/optional', optionalAuth, (c) => {
        return c.json({ 
          authenticated: c.get('authenticated'),
          message: 'Access granted',
        });
      });
      
      const response = await app.request('/optional');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.authenticated).toBe(false);
      expect(body.message).toBe('Access granted');
    });
  });

  describe('requireScopes', () => {
    it('should allow access when all required scopes are present', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(validToken));
      
      app.use('*', authMiddleware);
      app.get('/scoped', requireScopes('user-read-playback-state'), (c) => {
        return c.json({ message: 'Access granted' });
      });
      
      const response = await app.request('/scoped');
      const body = await response.json() as any;
      
      expect(response.status).toBe(200);
      expect(body.message).toBe('Access granted');
    });

    it('should deny access when required scopes are missing', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(validToken));
      
      app.use('*', authMiddleware);
      app.get('/scoped', requireScopes('playlist-modify-private'), (c) => {
        return c.json({ message: 'Access granted' });
      });
      
      const response = await app.request('/scoped');
      const body = await response.json() as any;
      
      expect(response.status).toBe(403);
      expect(body.error).toBe('Insufficient permissions');
      expect(body.missing_scopes).toEqual(['playlist-modify-private']);
    });

    it('should deny access when no tokens present', async () => {
      mockTokenStorage.get.mockResolvedValue(ok(null));
      
      app.use('*', authMiddleware);
      app.get('/scoped', requireScopes('user-read-playback-state'), (c) => {
        return c.json({ message: 'Access granted' });
      });
      
      const response = await app.request('/scoped');
      const body = await response.json() as any;
      
      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized: No authentication tokens');
    });

    it('should check multiple scopes', async () => {
      const { validateToken } = await import('../auth/index.ts');
      
      mockTokenStorage.get.mockResolvedValue(ok(validToken));
      (validateToken as any).mockReturnValue(ok(validToken));
      
      app.use('*', authMiddleware);
      app.get('/multi-scoped', 
        requireScopes('user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private'),
        (c) => {
          return c.json({ message: 'Access granted' });
        }
      );
      
      const response = await app.request('/multi-scoped');
      const body = await response.json() as any;
      
      expect(response.status).toBe(403);
      expect(body.error).toBe('Insufficient permissions');
      expect(body.required_scopes).toEqual([
        'user-read-playback-state', 
        'user-modify-playback-state', 
        'playlist-read-private',
      ]);
      expect(body.missing_scopes).toEqual(['playlist-read-private']);
      expect(body.granted_scopes).toEqual([
        'user-read-playback-state',
        'user-modify-playback-state',
      ]);
    });
  });
});