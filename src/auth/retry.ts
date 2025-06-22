import { Result, err } from 'neverthrow';
import type { NetworkError, AuthError } from '../result.ts';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: NetworkError | AuthError, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffFactor: 2,
  shouldRetry: (error, _attempt) => {
    // Retry on network errors and specific auth errors
    if (error.type === 'NetworkError') return true;
    if (error.type === 'AuthError' && error.reason === 'expired') return true;
    return false;
  },
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withExponentialBackoff<T, E extends NetworkError | AuthError>(
  fn: () => Promise<Result<T, E>>,
  options: RetryOptions = {},
): Promise<Result<T, E>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: E | null = null;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const result = await fn();
    
    if (result.isOk()) {
      return result;
    }
    
    lastError = result.error;
    
    // Check if we should retry
    if (attempt === opts.maxRetries || !opts.shouldRetry(lastError, attempt)) {
      return err(lastError);
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt),
      opts.maxDelayMs,
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    const finalDelay = delay + jitter;
    
    await sleep(finalDelay);
  }
  
  return err(lastError!);
}

/**
 * Create a retry wrapper for token refresh operations
 */
export function createTokenRefreshRetry(
  refreshFn: (refreshToken: string, clientId: string) => Promise<Result<any, NetworkError | AuthError>>,
) {
  return async (
    refreshToken: string,
    clientId: string,
    options?: RetryOptions,
  ) => {
    return withExponentialBackoff(
      () => refreshFn(refreshToken, clientId),
      {
        ...options,
        shouldRetry: (error, attempt) => {
          // Don't retry if refresh token is invalid/expired
          if (error.type === 'AuthError' && error.reason === 'invalid') {
            return false;
          }
          // Default retry logic
          return DEFAULT_OPTIONS.shouldRetry(error, attempt);
        },
      },
    );
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}