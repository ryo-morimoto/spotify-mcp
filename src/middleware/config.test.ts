import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Context, Next } from 'hono';
import { createConfig, configMiddleware } from './config.ts';

describe('Config Middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createConfig', () => {
    it('should create config with default values', () => {
      // Clear all env vars
      process.env = {};

      const config = createConfig();

      expect(config).toEqual({
        spotifyClientId: '',
        spotifyClientSecret: undefined,
        port: 8000,
        redirectUri: 'http://127.0.0.1:8000/callback',
        environment: 'development',
        logFormat: 'text',
      });
    });

    it('should use environment variables when set', () => {
      process.env['SPOTIFY_CLIENT_ID'] = 'test-client-id';
      process.env['SPOTIFY_CLIENT_SECRET'] = 'test-client-secret';
      process.env['PORT'] = '3000';
      process.env['NODE_ENV'] = 'production';
      process.env['LOG_FORMAT'] = 'json';

      const config = createConfig();

      expect(config).toEqual({
        spotifyClientId: 'test-client-id',
        spotifyClientSecret: 'test-client-secret',
        port: 3000,
        redirectUri: 'http://127.0.0.1:3000/callback',
        environment: 'production',
        logFormat: 'json',
      });
    });

    it('should handle partial environment variables', () => {
      process.env['SPOTIFY_CLIENT_ID'] = 'partial-client-id';
      process.env['PORT'] = '5000';
      // Leave others unset

      const config = createConfig();

      expect(config.spotifyClientId).toBe('partial-client-id');
      expect(config.spotifyClientSecret).toBeUndefined();
      expect(config.port).toBe(5000);
      expect(config.redirectUri).toBe('http://127.0.0.1:5000/callback');
      expect(config.environment).toBe('development');
      expect(config.logFormat).toBe('text');
    });

    it('should handle invalid port number', () => {
      process.env['PORT'] = 'invalid';

      const config = createConfig();

      expect(config.port).toBeNaN(); // parseInt returns NaN for invalid strings
    });

    it('should handle NODE_ENV variations', () => {
      process.env['NODE_ENV'] = 'prod';
      let config = createConfig();
      expect(config.environment).toBe('development');

      process.env['NODE_ENV'] = 'development';
      config = createConfig();
      expect(config.environment).toBe('development');

      process.env['NODE_ENV'] = 'production';
      config = createConfig();
      expect(config.environment).toBe('production');
    });

    it('should handle LOG_FORMAT variations', () => {
      process.env['LOG_FORMAT'] = 'JSON';
      let config = createConfig();
      expect(config.logFormat).toBe('text'); // Case sensitive

      process.env['LOG_FORMAT'] = 'json';
      config = createConfig();
      expect(config.logFormat).toBe('json');

      process.env['LOG_FORMAT'] = 'text';
      config = createConfig();
      expect(config.logFormat).toBe('text');
    });
  });

  describe('configMiddleware', () => {
    let mockContext: any;
    let mockNext: any;

    beforeEach(() => {
      mockContext = {
        set: vi.fn(),
      };
      mockNext = vi.fn().mockResolvedValue(undefined);
    });

    it('should set config in context', async () => {
      process.env['SPOTIFY_CLIENT_ID'] = 'middleware-test-id';
      process.env['PORT'] = '4000';

      await configMiddleware(mockContext as Context, mockNext as Next);

      expect(mockContext.set).toHaveBeenCalledWith('config', {
        spotifyClientId: 'middleware-test-id',
        spotifyClientSecret: undefined,
        port: 4000,
        redirectUri: 'http://127.0.0.1:4000/callback',
        environment: 'development',
        logFormat: 'text',
      });
    });

    it('should call next', async () => {
      await configMiddleware(mockContext as Context, mockNext as Next);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should preserve middleware chain order', async () => {
      const callOrder: string[] = [];

      mockContext.set.mockImplementation(() => {
        callOrder.push('set');
      });

      mockNext.mockImplementation(async () => {
        callOrder.push('next');
      });

      await configMiddleware(mockContext as Context, mockNext as Next);

      expect(callOrder).toEqual(['set', 'next']);
    });

    it('should propagate errors from next', async () => {
      const error = new Error('Next middleware error');
      mockNext.mockRejectedValue(error);

      await expect(configMiddleware(mockContext as Context, mockNext as Next)).rejects.toThrow(
        'Next middleware error',
      );
    });
  });
});
