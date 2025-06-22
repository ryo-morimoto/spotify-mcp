/**
 * Central type definitions for Spotify MCP Server
 *
 * This module provides a single entry point for all shared types
 * across the application, improving maintainability and discoverability.
 */

// Re-export token types
export type {
  SpotifyTokenResponse,
  SpotifyRefreshResponse,
  StoredToken,
  DurableObjectToken,
} from './token.ts';

export {
  normalizeTokenResponse,
  isTokenExpired,
  getSecondsUntilExpiry,
  hasRefreshToken,
} from './token.ts';

// Re-export spotify types
export type { SpotifyTrack, PlayerState, PlaybackCommand } from './spotify.ts';

// Re-export storage types
export type {
  TokenData,
  TokenStorage,
  CodeChallengeData,
  CodeChallengeStorage,
} from './storage.ts';

// Re-export oauth types
export type { PKCEChallenge, OAuthTokens } from './oauth.ts';

// Re-export mcp types
export type { TokenManager } from './mcp.ts';

// Re-export config types
export type { AppConfig } from './config.ts';

// Re-export error types
export type {
  NetworkError,
  AuthError,
  ValidationError,
  SpotifyError,
  UnknownError,
  AppError,
} from '../result.ts';
