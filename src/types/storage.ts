/**
 * Storage layer type definitions
 * 
 * Types for data persistence and storage abstractions.
 */

import type { StoredToken } from './token.ts';

/**
 * Alias for token data stored in storage layer
 */
export type TokenData = StoredToken;

/**
 * Interface for token storage operations
 */
export interface TokenStorage {
  get(userId: string): Promise<import('neverthrow').Result<TokenData | null, Error>>;
  store(userId: string, token: TokenData): Promise<import('neverthrow').Result<void, Error>>;
  refresh(userId: string): Promise<import('neverthrow').Result<TokenData, Error>>;
  clear(userId: string): Promise<import('neverthrow').Result<void, Error>>;
  getValidToken(userId: string): Promise<import('neverthrow').Result<string, Error>>;
}

/**
 * PKCE code challenge data stored during OAuth flow
 */
export interface CodeChallengeData {
  codeChallenge: string;
  codeVerifier: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Interface for PKCE code challenge storage operations
 */
export interface CodeChallengeStorage {
  store(state: string, data: CodeChallengeData): Promise<import('neverthrow').Result<void, Error>>;
  get(state: string): Promise<import('neverthrow').Result<CodeChallengeData | null, Error>>;
  clear(state: string): Promise<import('neverthrow').Result<void, Error>>;
}