/**
 * OAuth and authentication type definitions
 *
 * Types for OAuth flow, PKCE challenge, and authentication.
 */

import type { StoredToken } from './token.ts';

/**
 * PKCE (Proof Key for Code Exchange) challenge data
 * Used in OAuth authorization flow for enhanced security
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  challengeMethod: 'S256';
}

/**
 * OAuth tokens returned from authentication flow
 * Currently an alias for StoredToken but may diverge in the future
 */
export type OAuthTokens = StoredToken;
