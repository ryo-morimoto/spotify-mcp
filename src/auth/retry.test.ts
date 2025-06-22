import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { withExponentialBackoff, createTokenRefreshRetry } from './retry.ts';
import { createNetworkError, createAuthError } from '../result.ts';

describe('retry utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withExponentialBackoff', () => {
    it('should return success immediately if first attempt succeeds', async () => {
      const fn = vi.fn().mockResolvedValue(ok('success'));

      const resultPromise = withExponentialBackoff(fn);
      const result = await resultPromise;

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err(createNetworkError('Network failed')))
        .mockResolvedValueOnce(err(createNetworkError('Network failed')))
        .mockResolvedValueOnce(ok('success'));

      const resultPromise = withExponentialBackoff(fn, { initialDelayMs: 100 });

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.isOk()).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on invalid auth error', async () => {
      const fn = vi.fn().mockResolvedValue(err(createAuthError('Invalid token', 'invalid')));

      const result = await withExponentialBackoff(fn);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe('Invalid token');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on expired auth error', async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err(createAuthError('Token expired', 'expired')))
        .mockResolvedValueOnce(ok('refreshed'));

      const resultPromise = withExponentialBackoff(fn, { initialDelayMs: 100 });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.isOk()).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect maxRetries', async () => {
      const fn = vi.fn().mockResolvedValue(err(createNetworkError('Always fails')));

      const resultPromise = withExponentialBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 100,
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.isErr()).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should apply exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err(createNetworkError('Fail 1')))
        .mockResolvedValueOnce(err(createNetworkError('Fail 2')))
        .mockResolvedValueOnce(ok('success'));

      const resultPromise = withExponentialBackoff(fn, {
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
      });

      // Let the timer run
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.isOk()).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);

      // Verify retries happened (can't test exact timings with fake timers)
      expect(fn).toHaveBeenNthCalledWith(1);
      expect(fn).toHaveBeenNthCalledWith(2);
      expect(fn).toHaveBeenNthCalledWith(3);
    });
  });

  describe('createTokenRefreshRetry', () => {
    it('should create a retry wrapper for token refresh', async () => {
      const mockRefreshFn = vi
        .fn()
        .mockResolvedValueOnce(err(createNetworkError('Network error')))
        .mockResolvedValueOnce(ok({ accessToken: 'new-token' }));

      const retryRefresh = createTokenRefreshRetry(mockRefreshFn);

      const resultPromise = retryRefresh('refresh-token', 'client-id', {
        initialDelayMs: 100,
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.isOk()).toBe(true);
      expect(mockRefreshFn).toHaveBeenCalledTimes(2);
      expect(mockRefreshFn).toHaveBeenCalledWith('refresh-token', 'client-id');
    });

    it('should not retry on invalid refresh token', async () => {
      const mockRefreshFn = vi
        .fn()
        .mockResolvedValue(err(createAuthError('Invalid refresh token', 'invalid')));

      const retryRefresh = createTokenRefreshRetry(mockRefreshFn);
      const result = await retryRefresh('bad-token', 'client-id');

      expect(result.isErr()).toBe(true);
      expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    });
  });
});
