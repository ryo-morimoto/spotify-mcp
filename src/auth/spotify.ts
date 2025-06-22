import { Result, err } from 'neverthrow';
import type { NetworkError, AuthError } from '../result.ts';
import { createAuthError } from '../result.ts';
import type { OAuthTokens } from '../types/index.ts';
import { exchangeCodeForToken } from './tokens.ts';

/**
 * Handle OAuth callback with state validation
 */
export async function handleOAuthCallback(
  code: string,
  state: string,
  clientId: string,
  _clientSecret: string | undefined,
  redirectUri: string,
  codeVerifier: string,
  expectedState?: string,
): Promise<Result<OAuthTokens, NetworkError | AuthError>> {
  // Validate state parameter if provided
  if (expectedState && state !== expectedState) {
    return err(createAuthError('Invalid state parameter - possible CSRF attack', 'invalid'));
  }

  return exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);
}
