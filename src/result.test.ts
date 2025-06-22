import { describe, it, expect } from 'vitest';
import {
  createNetworkError,
  createAuthError,
  createValidationError,
  createSpotifyError,
  createUnknownError,
  isNetworkError,
  isAuthError,
  isValidationError,
  isSpotifyError,
  isUnknownError,
  tryCatch,
  tryCatchAsync,
  fromError,
  type AppError,
} from './result.ts';

describe('Error Type Guards', () => {
  describe('isNetworkError', () => {
    it('should identify NetworkError correctly', () => {
      const networkError = createNetworkError('Network failed');
      const authError = createAuthError('Unauthorized');

      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(authError)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should identify AuthError correctly', () => {
      const authError = createAuthError('Unauthorized', 'invalid');
      const networkError = createNetworkError('Network failed');

      expect(isAuthError(authError)).toBe(true);
      expect(isAuthError(networkError)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should identify ValidationError correctly', () => {
      const validationError = createValidationError('Invalid input', 'email');
      const authError = createAuthError('Unauthorized');

      expect(isValidationError(validationError)).toBe(true);
      expect(isValidationError(authError)).toBe(false);
    });
  });

  describe('isSpotifyError', () => {
    it('should identify SpotifyError correctly', () => {
      const spotifyError = createSpotifyError('Rate limited', '429');
      const networkError = createNetworkError('Network failed');

      expect(isSpotifyError(spotifyError)).toBe(true);
      expect(isSpotifyError(networkError)).toBe(false);
    });
  });

  describe('isUnknownError', () => {
    it('should identify UnknownError correctly', () => {
      const unknownError = createUnknownError('Something went wrong');
      const authError = createAuthError('Unauthorized');

      expect(isUnknownError(unknownError)).toBe(true);
      expect(isUnknownError(authError)).toBe(false);
    });
  });

  describe('type guard combinations', () => {
    it('should work with type narrowing', () => {
      const errors: AppError[] = [
        createNetworkError('Network'),
        createAuthError('Auth'),
        createValidationError('Validation'),
        createSpotifyError('Spotify'),
        createUnknownError('Unknown'),
      ];

      const networkErrors = errors.filter(isNetworkError);
      const authErrors = errors.filter(isAuthError);
      const validationErrors = errors.filter(isValidationError);
      const spotifyErrors = errors.filter(isSpotifyError);
      const unknownErrors = errors.filter(isUnknownError);

      expect(networkErrors).toHaveLength(1);
      expect(authErrors).toHaveLength(1);
      expect(validationErrors).toHaveLength(1);
      expect(spotifyErrors).toHaveLength(1);
      expect(unknownErrors).toHaveLength(1);
    });
  });
});

describe('Utility Functions', () => {
  describe('tryCatch', () => {
    it('should return ok result for successful function', () => {
      const result = tryCatch(() => 42);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it('should return err result for throwing function', () => {
      const result = tryCatch(() => {
        throw new Error('Test error');
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UnknownError');
        expect(result.error.message).toBe('An unexpected error occurred');
        expect(result.error.cause).toBeInstanceOf(Error);
      }
    });

    it('should handle non-Error throws', () => {
      const result = tryCatch(() => {
        throw 'String error';
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UnknownError');
        expect(result.error.cause).toBe('String error');
      }
    });

    it('should work with complex return types', () => {
      const result = tryCatch(() => ({ foo: 'bar', num: 123 }));

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ foo: 'bar', num: 123 });
      }
    });
  });

  describe('tryCatchAsync', () => {
    it('should return ok result for successful async function', async () => {
      const result = await tryCatchAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async result';
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('async result');
      }
    });

    it('should return err result for rejecting async function', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('Async error');
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UnknownError');
        expect(result.error.message).toBe('An unexpected error occurred');
        expect(result.error.cause).toBeInstanceOf(Error);
      }
    });

    it('should handle promise rejection', async () => {
      const result = await tryCatchAsync(() => Promise.reject('Rejected'));

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.cause).toBe('Rejected');
      }
    });

    it('should handle async/await with multiple operations', async () => {
      const result = await tryCatchAsync(async () => {
        const value1 = await Promise.resolve(10);
        const value2 = await Promise.resolve(20);
        return value1 + value2;
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(30);
      }
    });
  });

  describe('fromError', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error message');
      const result = fromError(error);

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('Test error message');
      expect(result.cause).toBe(error);
    });

    it('should handle string errors', () => {
      const result = fromError('String error');

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('String error');
      expect(result.cause).toBeUndefined();
    });

    it('should handle null with default message', () => {
      const result = fromError(null);

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('An error occurred');
      expect(result.cause).toBe(null);
    });

    it('should handle undefined with default message', () => {
      const result = fromError(undefined);

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('An error occurred');
      expect(result.cause).toBe(undefined);
    });

    it('should use custom default message', () => {
      const result = fromError(null, 'Custom error message');

      expect(result.message).toBe('Custom error message');
    });

    it('should handle complex error objects', () => {
      const complexError = { code: 'ERR_001', details: 'Complex error' };
      const result = fromError(complexError);

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('An error occurred');
      expect(result.cause).toBe(complexError);
    });

    it('should handle number errors with default message', () => {
      const result = fromError(404);

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('An error occurred');
      expect(result.cause).toBe(404);
    });

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('Custom error message');
      const result = fromError(customError);

      expect(result.message).toBe('Custom error message');
      expect(result.cause).toBe(customError);
    });
  });
});
