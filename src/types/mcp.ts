/**
 * Model Context Protocol (MCP) type definitions
 * 
 * Types specific to MCP server implementation and tools.
 */

import { Result } from 'neverthrow';
import type { NetworkError, AuthError } from '../result.ts';

/**
 * Interface for managing authentication tokens in MCP context
 * Provides access token retrieval and refresh capabilities
 */
export interface TokenManager {
  getAccessToken(): Promise<Result<string, NetworkError | AuthError>>;
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>;
}