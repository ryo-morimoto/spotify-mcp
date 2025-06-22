import { Result, ok, err } from 'neverthrow';
import type { NetworkError, AuthError } from '../result.ts';
import { createNetworkError, createAuthError } from '../result.ts';
import type {
  SpotifyTokenResponse,
  SpotifyRefreshResponse,
  StoredToken,
  OAuthTokens,
} from '../types/index.ts';
import { normalizeTokenResponse } from '../types/index.ts';
import { withExponentialBackoff } from './retry.ts';

const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string,
): Promise<Result<OAuthTokens, NetworkError | AuthError>> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      if (response.status === 400 && errorData.error === 'invalid_grant') {
        return err(createAuthError('Token exchange failed: Invalid authorization code', 'invalid'));
      }
      return err(
        createAuthError(
          `Token exchange failed: ${response.status} ${response.statusText}`,
          'invalid',
        ),
      );
    }

    const data = (await response.json()) as SpotifyTokenResponse;
    return ok(normalizeTokenResponse(data));
  } catch (error) {
    return err(
      createNetworkError(
        error instanceof Error ? error.message : 'Network error during token exchange',
      ),
    );
  }
}

export async function refreshToken(
  refreshTokenStr: string,
  clientId: string,
): Promise<Result<StoredToken, NetworkError | AuthError>> {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenStr,
      client_id: clientId,
    });

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      if (response.status === 400 && errorData.error === 'invalid_grant') {
        return err(createAuthError('Token refresh failed: Refresh token expired', 'expired'));
      }
      return err(
        createAuthError(
          `Token refresh failed: ${response.status} ${response.statusText}`,
          'invalid',
        ),
      );
    }

    const data = (await response.json()) as SpotifyRefreshResponse;
    return ok(normalizeTokenResponse(data, refreshTokenStr));
  } catch (error) {
    return err(
      createNetworkError(
        error instanceof Error ? error.message : 'Network error during token refresh',
      ),
    );
  }
}

export function validateToken(
  tokens: StoredToken,
  bufferSeconds: number = 60,
): Result<boolean, never> {
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  const isValid = tokens.expiresAt > now + bufferMs;
  return ok(isValid);
}

/**
 * Refresh token with exponential backoff retry logic
 */
export async function refreshTokenWithRetry(
  refreshTokenStr: string,
  clientId: string,
  maxRetries: number = 3,
): Promise<Result<StoredToken, NetworkError | AuthError>> {
  return withExponentialBackoff(() => refreshToken(refreshTokenStr, clientId), {
    maxRetries,
    initialDelayMs: 1000,
    maxDelayMs: 16000,
    shouldRetry: (error, _attempt) => {
      // Don't retry if refresh token is invalid/expired
      if (error.type === 'AuthError' && error.reason === 'invalid') {
        return false;
      }
      // Retry on network errors and temporary auth errors
      return (
        error.type === 'NetworkError' || (error.type === 'AuthError' && error.reason === 'expired')
      );
    },
  });
}
