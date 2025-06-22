import type { NetworkError, AuthError, SpotifyError } from '../../result.ts';
import { createNetworkError, createAuthError, createSpotifyError } from '../../result.ts';

/**
 * Maps Spotify SDK errors to our domain error types
 * 
 * The @spotify/web-api-ts-sdk doesn't export specific error types.
 * It throws standard Error objects with additional properties:
 * - status: HTTP status code (number)
 * - message: Error description (string)
 * - statusText: HTTP status text (optional)
 */
export function mapSpotifyError(error: unknown): NetworkError | AuthError | SpotifyError {
  // Handle non-error cases
  if (!error) {
    return createNetworkError('Unknown error occurred');
  }

  // Handle non-object errors (e.g., string throws)
  if (typeof error !== 'object') {
    return createNetworkError(String(error));
  }

  // Type guard for errors with status property
  const errorWithStatus = error as { status?: number; message?: string; statusText?: string };
  
  const status = errorWithStatus.status;
  const message = errorWithStatus.message || 'Unknown error';

  // Map specific HTTP status codes to our error types
  switch (status) {
    case 401:
      // Token expired or invalid
      return createAuthError(
        message || 'Invalid or expired access token',
        'expired'
      );

    case 403:
      // Forbidden - usually OAuth scope issues
      return createAuthError(
        message || 'Insufficient permissions',
        'invalid'
      );

    case 429:
      // Rate limiting
      return createSpotifyError(
        message || 'Rate limit exceeded',
        '429'
      );

    case 404:
      // Resource not found (e.g., no active device for playback)
      return createSpotifyError(
        message || 'Resource not found',
        '404'
      );

    case 400:
      // Bad request - client error
      return createSpotifyError(
        message || 'Invalid request',
        '400'
      );

    default:
      // Handle other 4xx errors as Spotify errors
      if (status && status >= 400 && status < 500) {
        return createSpotifyError(
          message,
          status.toString()
        );
      }

      // Handle 5xx errors and network issues as NetworkError
      if (status && status >= 500) {
        return createNetworkError(
          message,
          status,
          error
        );
      }

      // No status code - likely a network error
      return createNetworkError(
        message,
        undefined,
        error
      );
  }
}