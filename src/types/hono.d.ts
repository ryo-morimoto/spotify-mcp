/**
 * Hono type augmentations for Spotify MCP Server
 *
 * This file centralizes all custom context variables used throughout the application.
 * Each variable is documented with its purpose and which middleware sets it.
 */

import type { AppConfig } from '../middleware/config.ts';
import type { getTokenStorage, getCodeChallengeStorage } from '../storage/index.ts';
import type { StoredToken } from './token.ts';

declare module 'hono' {
  interface ContextVariableMap {
    // Authentication & User Management (set by authMiddleware)
    /** Current user ID, defaults to 'default-user' for single-user mode */
    userId: string;

    /** Whether the current user has valid authentication tokens */
    authenticated: boolean;

    /** Current user's authentication tokens (set when authenticated) */
    tokens?: StoredToken;

    /** Token storage instance for managing OAuth tokens */
    tokenStorage: ReturnType<typeof getTokenStorage>;

    // OAuth Code Challenge Management (set by codeChallengeMiddleware)
    /** Storage for PKCE code challenges during OAuth flow */
    codeChallengeStorage: ReturnType<typeof getCodeChallengeStorage>;

    // Application Configuration (set by configMiddleware)
    /** Application configuration derived from environment variables */
    config: AppConfig;

    // Session Management (set by sessionMiddleware)
    /** Session identifier for tracking user sessions */
    sessionId: string;
  }
}
