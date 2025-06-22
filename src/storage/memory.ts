import { Result, ok, err } from 'neverthrow'
import type { TokenStorage, TokenData, CodeChallengeStorage, CodeChallengeData } from '../types/storage.ts';
import { refreshToken } from '../auth/index.ts'
import { createConfig } from '../middleware/index.ts'

// Token storage interface
interface MemoryTokenStorage {
  tokens: Map<string, TokenData>
}

// Create a new token storage instance
export function createInMemoryTokenStorage(): TokenStorage {
  const storage: MemoryTokenStorage = {
    tokens: new Map<string, TokenData>()
  }

  return {
    store: (userId: string, tokens: TokenData) => storeTokens(storage, userId, tokens),
    get: (userId: string) => getTokens(storage, userId),
    refresh: (userId: string) => refreshTokens(storage, userId),
    clear: (userId: string) => clearTokens(storage, userId),
    getValidToken: (userId: string) => getValidToken(storage, userId)
  }
}

// Store tokens
async function storeTokens(
  storage: MemoryTokenStorage,
  userId: string,
  tokens: TokenData
): Promise<Result<void, Error>> {
  storage.tokens.set(userId, tokens)
  return ok(undefined)
}

// Get tokens
async function getTokens(
  storage: MemoryTokenStorage,
  userId: string
): Promise<Result<TokenData | null, Error>> {
  const token = storage.tokens.get(userId)
  return ok(token || null)
}

// Refresh tokens
async function refreshTokens(
  storage: MemoryTokenStorage,
  userId: string
): Promise<Result<TokenData, Error>> {
  const tokenResult = await getTokens(storage, userId)
  if (tokenResult.isErr()) {
    return err(tokenResult.error)
  }

  const token = tokenResult.value
  if (!token || !token.refreshToken) {
    return err(new Error('No refresh token available'))
  }

  const config = createConfig()
  const refreshResult = await refreshToken(token.refreshToken, config.spotifyClientId)
  if (refreshResult.isErr()) {
    return err(new Error(refreshResult.error.message))
  }

  const newTokens = refreshResult.value
  const updatedTokens: TokenData = {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken || token.refreshToken,
    expiresAt: newTokens.expiresAt,
    tokenType: newTokens.tokenType,
    scope: newTokens.scope
  }

  await storeTokens(storage, userId, updatedTokens)
  return ok(updatedTokens)
}

// Clear tokens
async function clearTokens(
  storage: MemoryTokenStorage,
  userId: string
): Promise<Result<void, Error>> {
  storage.tokens.delete(userId)
  return ok(undefined)
}

// Get valid token (with auto-refresh)
async function getValidToken(
  storage: MemoryTokenStorage,
  userId: string
): Promise<Result<string, Error>> {
  const tokenResult = await getTokens(storage, userId)
  if (tokenResult.isErr()) {
    return err(tokenResult.error)
  }

  const token = tokenResult.value
  if (!token) {
    return err(new Error('No token found'))
  }

  // Check if token is expired
  if (Date.now() >= token.expiresAt) {
    const refreshResult = await refreshTokens(storage, userId)
    if (refreshResult.isErr()) {
      return err(refreshResult.error)
    }
    return ok(refreshResult.value.accessToken)
  }

  return ok(token.accessToken)
}

// Code challenge storage interface
interface MemoryCodeChallengeStorage {
  challenges: Map<string, CodeChallengeData>
}

// Create a new code challenge storage instance
export function createInMemoryCodeChallengeStorage(): CodeChallengeStorage {
  const storage: MemoryCodeChallengeStorage = {
    challenges: new Map<string, CodeChallengeData>()
  }

  return {
    store: (state: string, data: CodeChallengeData) => storeChallenge(storage, state, data),
    get: (state: string) => getChallenge(storage, state),
    clear: (state: string) => clearChallenge(storage, state)
  }
}

// Store code challenge
async function storeChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string,
  data: CodeChallengeData
): Promise<Result<void, Error>> {
  storage.challenges.set(state, data)
  return ok(undefined)
}

// Get code challenge
async function getChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string
): Promise<Result<CodeChallengeData | null, Error>> {
  const challenge = storage.challenges.get(state)
  
  // Check if expired
  if (challenge && Date.now() >= challenge.expiresAt) {
    storage.challenges.delete(state)
    return ok(null)
  }
  
  return ok(challenge || null)
}

// Clear code challenge
async function clearChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string
): Promise<Result<void, Error>> {
  storage.challenges.delete(state)
  return ok(undefined)
}