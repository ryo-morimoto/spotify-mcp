import { describe, it, expect } from 'vitest';
import { mapSpotifyError } from './errorMapper.ts';

describe('mapSpotifyError', () => {
  describe('Auth errors (401, 403)', () => {
    it('should map 401 errors to AuthError with expired type', () => {
      const error = {
        status: 401,
        message: 'Unauthorized - Token expired',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('AuthError');
      expect(result.message).toBe('Unauthorized - Token expired');
      expect((result as any).reason).toBe('expired');
    });

    it('should use default message for 401 without message', () => {
      const error = { status: 401 };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('AuthError');
      expect(result.message).toBe('Invalid or expired access token');
      expect((result as any).reason).toBe('expired');
    });

    it('should map 403 errors to AuthError with invalid type', () => {
      const error = {
        status: 403,
        message: 'Forbidden - Missing scope',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('AuthError');
      expect(result.message).toBe('Forbidden - Missing scope');
      expect((result as any).reason).toBe('invalid');
    });

    it('should use default message for 403 without message', () => {
      const error = { status: 403 };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('AuthError');
      expect(result.message).toBe('Insufficient permissions');
      expect((result as any).reason).toBe('invalid');
    });
  });

  describe('Spotify API errors (4xx)', () => {
    it('should map 429 to SpotifyError with rate limit message', () => {
      const error = {
        status: 429,
        message: 'Too Many Requests',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Too Many Requests');
      expect((result as any).spotifyErrorCode).toBe('429');
    });

    it('should use default message for 429 without message', () => {
      const error = { status: 429 };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Rate limit exceeded');
    });

    it('should map 404 to SpotifyError', () => {
      const error = {
        status: 404,
        message: 'Device not found',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Device not found');
      expect((result as any).spotifyErrorCode).toBe('404');
    });

    it('should map 400 to SpotifyError', () => {
      const error = {
        status: 400,
        message: 'Invalid track URI',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Invalid track URI');
      expect((result as any).spotifyErrorCode).toBe('400');
    });

    it('should map other 4xx errors to SpotifyError', () => {
      const error = {
        status: 418,
        message: "I'm a teapot",
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe("I'm a teapot");
      expect((result as any).spotifyErrorCode).toBe('418');
    });
  });

  describe('Network errors (5xx and others)', () => {
    it('should map 5xx errors to NetworkError', () => {
      const error = {
        status: 500,
        message: 'Internal Server Error',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Internal Server Error');
      expect((result as any).statusCode).toBe(500);
    });

    it('should map 503 errors to NetworkError', () => {
      const error = {
        status: 503,
        message: 'Service Unavailable',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Service Unavailable');
      expect((result as any).statusCode).toBe(503);
    });

    it('should map errors without status to NetworkError', () => {
      const error = {
        message: 'Network timeout',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Network timeout');
      expect((result as any).statusCode).toBeUndefined();
    });

    it('should use default message when no message provided', () => {
      const error = { someOtherProp: 'value' };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('Edge cases', () => {
    it('should handle null error', () => {
      const result = mapSpotifyError(null);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Unknown error occurred');
    });

    it('should handle undefined error', () => {
      const result = mapSpotifyError(undefined);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Unknown error occurred');
    });

    it('should handle string errors', () => {
      const result = mapSpotifyError('Something went wrong');

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle number errors', () => {
      const result = mapSpotifyError(404);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('404');
    });

    it('should handle boolean errors', () => {
      const result = mapSpotifyError(false);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Unknown error occurred');
    });

    it('should handle Error instances', () => {
      const error = new Error('Standard error');
      const result = mapSpotifyError(error);

      expect(result.type).toBe('NetworkError');
      expect(result.message).toBe('Standard error');
    });

    it('should include original error in cause', () => {
      const originalError = { status: 500, message: 'Server error' };
      const result = mapSpotifyError(originalError);

      expect(result.type).toBe('NetworkError');
      expect((result as any).cause).toBe(originalError);
    });
  });

  describe('Complex error objects', () => {
    it('should handle error with statusText', () => {
      const error = {
        status: 404,
        message: 'Not Found',
        statusText: 'NOT_FOUND',
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Not Found');
    });

    it('should handle error with additional properties', () => {
      const error = {
        status: 400,
        message: 'Bad Request',
        response: { data: 'Additional info' },
        request: { url: 'https://api.spotify.com' },
      };

      const result = mapSpotifyError(error);

      expect(result.type).toBe('SpotifyError');
      expect(result.message).toBe('Bad Request');
      expect((result as any).spotifyErrorCode).toBe('400');
    });
  });
});