import { Result, ok, err } from 'neverthrow';
import { createHash, randomBytes } from 'crypto';
import type { NetworkError } from '../result.ts';
import { createNetworkError } from '../result.ts';
import type { PKCEChallenge } from '../types/index.ts';

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
  state?: string,
): Result<string, NetworkError> {
  try {
    const url = new URL('https://accounts.spotify.com/authorize');

    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('code_challenge', pkceChallenge.codeChallenge);
    url.searchParams.set('code_challenge_method', pkceChallenge.challengeMethod);
    url.searchParams.set('scope', scopes.join(' '));

    if (state) {
      url.searchParams.set('state', state);
    }

    return ok(url.toString());
  } catch (error) {
    return err(
      createNetworkError(error instanceof Error ? error.message : 'Failed to generate auth URL'),
    );
  }
}