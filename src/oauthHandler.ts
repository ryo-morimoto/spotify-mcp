import { Result, ok, err } from 'neverthrow';
import { createHash, randomBytes } from 'crypto';
import type { NetworkError, AuthError } from './result.ts';

const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  challengeMethod: 'S256';
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  expiresAt: number;
}

function createNetworkError(message: string): NetworkError {
  return {
    type: 'NetworkError',
    message: `OAuth request failed: ${message}`,
  };
}

function createAuthError(message: string, reason: AuthError['reason'] = 'invalid'): AuthError {
  return {
    type: 'AuthError',
    message,
    reason,
  };
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateCodeChallenge(): Promise<Result<PKCEChallenge, NetworkError>> {
  try {
    // Generate code verifier (43-128 characters)
    const verifier = base64URLEncode(randomBytes(32));

    // Generate code challenge using SHA256
    const challenge = base64URLEncode(createHash('sha256').update(verifier).digest());

    return ok({
      codeVerifier: verifier,
      codeChallenge: challenge,
      challengeMethod: 'S256',
    });
  } catch (error) {
    return err(
      createNetworkError(
        error instanceof Error ? error.message : 'Failed to generate PKCE challenge',
      ),
    );
  }
}

export function generateAuthUrl(
  clientId: string,
  redirectUri: string,
  pkceChallenge: PKCEChallenge,
  scopes: string[],
): Result<string, NetworkError> {
  try {
    const url = new URL(`${SPOTIFY_ACCOUNTS_BASE}/authorize`);

    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('code_challenge', pkceChallenge.codeChallenge);
    url.searchParams.set('code_challenge_method', pkceChallenge.challengeMethod);
    url.searchParams.set('scope', scopes.join(' '));

    return ok(url.toString());
  } catch (error) {
    return err(
      createNetworkError(error instanceof Error ? error.message : 'Failed to generate auth URL'),
    );
  }
}

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

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };

    return ok({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      expiresAt: Date.now() + data.expires_in * 1000,
    });
  } catch (error) {
    return err(
      createNetworkError(
        error instanceof Error ? error.message : 'Network error during token exchange',
      ),
    );
  }
}

export async function refreshToken(
  refreshToken: string,
  clientId: string,
): Promise<Result<OAuthTokens, NetworkError | AuthError>> {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
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

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
      refresh_token?: string;
    };

    return ok({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Spotify may not return a new refresh token
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      expiresAt: Date.now() + data.expires_in * 1000,
    });
  } catch (error) {
    return err(
      createNetworkError(
        error instanceof Error ? error.message : 'Network error during token refresh',
      ),
    );
  }
}

export function validateToken(
  tokens: OAuthTokens,
  bufferSeconds: number = 60,
): Result<boolean, never> {
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  const isValid = tokens.expiresAt > now + bufferMs;
  return ok(isValid);
}

export async function handleOAuthCallback(
  code: string,
  _state: string,
  clientId: string,
  _clientSecret: string | undefined,
  redirectUri: string,
  codeVerifier: string,
): Promise<Result<OAuthTokens, NetworkError | AuthError>> {
  return exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);
}
