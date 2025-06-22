import { Result, ok } from 'neverthrow';
import type {
  TokenStorage,
  TokenData,
  CodeChallengeStorage,
  CodeChallengeData,
} from '../types/storage.ts';

// Token storage interface
interface MemoryTokenStorage {
  tokens: Map<string, TokenData>;
}

// Create a new token storage instance
export function createInMemoryTokenStorage(): TokenStorage {
  const storage: MemoryTokenStorage = {
    tokens: new Map<string, TokenData>(),
  };

  return {
    store: (userId: string, tokens: TokenData) => storeTokens(storage, userId, tokens),
    get: (userId: string) => getTokens(storage, userId),
    clear: (userId: string) => clearTokens(storage, userId),
  };
}

// Store tokens
async function storeTokens(
  storage: MemoryTokenStorage,
  userId: string,
  tokens: TokenData,
): Promise<Result<void, Error>> {
  storage.tokens.set(userId, tokens);
  return ok(undefined);
}

// Get tokens
async function getTokens(
  storage: MemoryTokenStorage,
  userId: string,
): Promise<Result<TokenData | null, Error>> {
  const token = storage.tokens.get(userId);
  return ok(token || null);
}

// Clear tokens
async function clearTokens(
  storage: MemoryTokenStorage,
  userId: string,
): Promise<Result<void, Error>> {
  storage.tokens.delete(userId);
  return ok(undefined);
}

// Code challenge storage interface
interface MemoryCodeChallengeStorage {
  challenges: Map<string, CodeChallengeData>;
}

// Create a new code challenge storage instance
export function createInMemoryCodeChallengeStorage(): CodeChallengeStorage {
  const storage: MemoryCodeChallengeStorage = {
    challenges: new Map<string, CodeChallengeData>(),
  };

  return {
    store: (state: string, data: CodeChallengeData) => storeChallenge(storage, state, data),
    get: (state: string) => getChallenge(storage, state),
    clear: (state: string) => clearChallenge(storage, state),
  };
}

// Store code challenge
async function storeChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string,
  data: CodeChallengeData,
): Promise<Result<void, Error>> {
  storage.challenges.set(state, data);
  return ok(undefined);
}

// Get code challenge
async function getChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string,
): Promise<Result<CodeChallengeData | null, Error>> {
  const challenge = storage.challenges.get(state);

  // Check if expired
  if (challenge && Date.now() >= challenge.expiresAt) {
    storage.challenges.delete(state);
    return ok(null);
  }

  return ok(challenge || null);
}

// Clear code challenge
async function clearChallenge(
  storage: MemoryCodeChallengeStorage,
  state: string,
): Promise<Result<void, Error>> {
  storage.challenges.delete(state);
  return ok(undefined);
}
