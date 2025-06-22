/**
 * Token type definitions for Spotify MCP Server
 *
 * This module defines canonical token types for different contexts:
 * - API responses from Spotify
 * - Internal storage representations
 * - Type conversion utilities
 */

/**
 * Raw token response from Spotify OAuth API
 * Uses snake_case as per Spotify API convention
 */
export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Duration in seconds
  token_type: string; // Usually "Bearer"
  scope: string; // Space-separated scopes
}

/**
 * Partial token response from Spotify refresh endpoint
 * refresh_token is optional as it may not be returned on refresh
 */
export interface SpotifyRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Internal token representation for storage
 * Uses camelCase and normalized fields
 */
export interface StoredToken {
  accessToken: string;
  refreshToken?: string; // Optional: may not be returned on refresh
  expiresAt: number; // Unix timestamp (milliseconds)
  tokenType: string;
  scope?: string; // Optional: not always needed internally
}

/**
 * Extended token data for Durable Objects
 * Includes additional fields needed for token management
 */
export interface DurableObjectToken extends StoredToken {
  clientId: string; // Needed for refresh operations
  clientSecret?: string; // Optional: only for confidential clients
  userId: string; // User identifier
  createdAt: number; // When the token was first stored
  lastRefreshed?: number; // Last refresh timestamp
}

/**
 * Convert Spotify API response to internal storage format
 */
export function normalizeTokenResponse(
  response: SpotifyTokenResponse | SpotifyRefreshResponse,
  existingRefreshToken?: string,
): StoredToken {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token || existingRefreshToken,
    expiresAt: Date.now() + response.expires_in * 1000,
    tokenType: response.token_type,
    scope: response.scope,
  };
}

/**
 * Check if a token is expired or will expire soon
 * @param token - The token to check
 * @param bufferSeconds - Consider expired if expires within this many seconds (default: 60)
 */
export function isTokenExpired(token: StoredToken, bufferSeconds = 60): boolean {
  const bufferMs = bufferSeconds * 1000;
  return Date.now() + bufferMs >= token.expiresAt;
}

/**
 * Calculate seconds until token expires
 */
export function getSecondsUntilExpiry(token: StoredToken): number {
  const msUntilExpiry = token.expiresAt - Date.now();
  return Math.max(0, Math.floor(msUntilExpiry / 1000));
}

/**
 * Type guard to check if a token has a refresh token
 */
export function hasRefreshToken(
  token: StoredToken,
): token is StoredToken & { refreshToken: string } {
  return typeof token.refreshToken === 'string' && token.refreshToken.length > 0;
}
