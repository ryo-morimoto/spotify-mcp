import { Result, ok, err } from 'neverthrow';
import type { TokenStorage, TokenProvider } from '../types/index.ts';
import type { NetworkError, AuthError } from '../result.ts';
import { createNetworkError, createAuthError } from '../result.ts';
import { validateToken, refreshTokenWithRetry } from '../auth/index.ts';

// Create a token manager adapter
export function createTokenProviderAdapter(
  tokenStorage: TokenStorage,
  clientId: string,
  userId: string = 'default-user',
): TokenProvider {
  return {
    getAccessToken: () => getAccessToken(tokenStorage, clientId, userId),
    refreshTokenIfNeeded: () => refreshTokenIfNeeded(tokenStorage, clientId, userId),
  };
}

// Get access token
async function getAccessToken(
  tokenStorage: TokenStorage,
  clientId: string,
  userId: string,
): Promise<Result<string, NetworkError | AuthError>> {
  const result = await tokenStorage.get(userId);

  if (result.isErr()) {
    return err(createNetworkError('Failed to retrieve token from storage'));
  }

  const token = result.value;
  if (!token) {
    return err(createAuthError('No token found', 'missing'));
  }

  // Validate token with 60 second buffer
  const validationResult = validateToken(token, 60);
  if (validationResult.isOk() && validationResult.value) {
    return ok(token.accessToken);
  }

  // Token is expired, try to refresh
  if (token.refreshToken) {
    const refreshResult = await refreshTokenWithRetry(token.refreshToken, clientId);
    if (refreshResult.isOk()) {
      // Store the new token
      await tokenStorage.store(userId, refreshResult.value);
      return ok(refreshResult.value.accessToken);
    }
    return refreshResult.map((t) => t.accessToken);
  }

  return err(createAuthError('Token expired and no refresh token available', 'expired'));
}

// Refresh token if needed
async function refreshTokenIfNeeded(
  tokenStorage: TokenStorage,
  clientId: string,
  userId: string,
): Promise<Result<string, NetworkError | AuthError>> {
  // This is just an alias for getAccessToken since it already handles refresh
  return getAccessToken(tokenStorage, clientId, userId);
}
