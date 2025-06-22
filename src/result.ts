import type { Result as NeverthrowResult } from 'neverthrow';
import { ok, err } from 'neverthrow';

/**
 * Custom Result type that extends neverthrow for the Spotify MCP project
 */
type Result<T, E> = NeverthrowResult<T, E>;

/**
 * Common error types for the application
 */
interface BaseError {
  readonly type: string;
  readonly message: string;
  readonly cause?: unknown;
}

export interface NetworkError extends BaseError {
  readonly type: 'NetworkError';
  readonly statusCode?: number;
}

export interface AuthError extends BaseError {
  readonly type: 'AuthError';
  readonly reason: 'expired' | 'invalid' | 'missing';
}

export interface ValidationError extends BaseError {
  readonly type: 'ValidationError';
  readonly field?: string;
}

export interface SpotifyError extends BaseError {
  readonly type: 'SpotifyError';
  readonly spotifyErrorCode?: string;
}

export interface UnknownError extends BaseError {
  readonly type: 'UnknownError';
}

export type AppError = NetworkError | AuthError | ValidationError | SpotifyError | UnknownError;

/**
 * Error constructors - All centralized here for consistent usage across the codebase
 */
export const createNetworkError = (
  message: string,
  statusCode?: number,
  cause?: unknown,
): NetworkError => ({
  type: 'NetworkError',
  message,
  statusCode,
  cause,
});

export const createAuthError = (
  message: string,
  reason: AuthError['reason'] = 'invalid',
  cause?: unknown,
): AuthError => ({
  type: 'AuthError',
  message,
  reason,
  cause,
});

export const createValidationError = (
  message: string,
  field?: string,
  cause?: unknown,
): ValidationError => ({
  type: 'ValidationError',
  message,
  field,
  cause,
});

export const createSpotifyError = (
  message: string,
  spotifyErrorCode?: string,
  cause?: unknown,
): SpotifyError => ({
  type: 'SpotifyError',
  message,
  spotifyErrorCode,
  cause,
});

export const createUnknownError = (message: string, cause?: unknown): UnknownError => ({
  type: 'UnknownError',
  message,
  cause,
});

/**
 * Type guards for error types
 */
export const isNetworkError = (error: AppError): error is NetworkError =>
  error.type === 'NetworkError';

export const isAuthError = (error: AppError): error is AuthError => error.type === 'AuthError';

export const isValidationError = (error: AppError): error is ValidationError =>
  error.type === 'ValidationError';

export const isSpotifyError = (error: AppError): error is SpotifyError =>
  error.type === 'SpotifyError';

export const isUnknownError = (error: AppError): error is UnknownError =>
  error.type === 'UnknownError';

/**
 * Utility functions for working with Results
 */
export const tryCatch = <T>(fn: () => T): Result<T, UnknownError> => {
  try {
    return ok(fn());
  } catch (error) {
    return err(createUnknownError('An unexpected error occurred', error));
  }
};

export const tryCatchAsync = async <T>(fn: () => Promise<T>): Promise<Result<T, UnknownError>> => {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    return err(createUnknownError('An unexpected error occurred', error));
  }
};

/**
 * Helper to convert generic Error objects to typed errors
 */
export const fromError = (error: unknown, defaultMessage = 'An error occurred'): UnknownError => {
  if (error instanceof Error) {
    return createUnknownError(error.message, error);
  }
  if (typeof error === 'string') {
    return createUnknownError(error);
  }
  return createUnknownError(defaultMessage, error);
};

// Example usage in tests
if (import.meta.vitest) {
  const { test, expect, describe } = import.meta.vitest;

  describe('Result utilities', () => {
    test('tryCatch captures exceptions', () => {
      const result = tryCatch(() => {
        throw new Error('Test error');
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UnknownError');
        expect(result.error.message).toBe('An unexpected error occurred');
      }
    });

    test('tryCatch returns success for non-throwing functions', () => {
      const result = tryCatch(() => 42);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    test('error type guards work correctly', () => {
      const networkError = createNetworkError('Network failed', 500);
      const authError = createAuthError('Token expired', 'expired');

      expect(isNetworkError(networkError)).toBe(true);
      expect(isAuthError(authError)).toBe(true);
      expect(isNetworkError(authError)).toBe(false);
    });

    test('tryCatchAsync handles async functions', async () => {
      const result = await tryCatchAsync(async () => {
        await Promise.resolve();
        throw new Error('Async error');
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UnknownError');
      }
    });
  });
}
