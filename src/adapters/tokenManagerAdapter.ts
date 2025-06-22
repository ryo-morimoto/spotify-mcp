import { Result } from 'neverthrow'
import type { TokenStorage, TokenManager } from '../types/index.ts';
import type { NetworkError, AuthError } from '../result.ts'

// Create a token manager adapter
export function createTokenManagerAdapter(
  tokenStorage: TokenStorage,
  userId: string = 'default-user'
): TokenManager {
  return {
    getAccessToken: () => getAccessToken(tokenStorage, userId),
    refreshTokenIfNeeded: () => refreshTokenIfNeeded(tokenStorage, userId)
  }
}

// Get access token
async function getAccessToken(
  tokenStorage: TokenStorage,
  userId: string
): Promise<Result<string, NetworkError | AuthError>> {
  const result = await tokenStorage.getValidToken(userId)
  return result.mapErr(error => ({
    type: 'NetworkError' as const,
    message: error.message
  }))
}

// Refresh token if needed (currently delegates to getAccessToken)
async function refreshTokenIfNeeded(
  tokenStorage: TokenStorage,
  userId: string
): Promise<Result<string, NetworkError | AuthError>> {
  return getAccessToken(tokenStorage, userId)
}