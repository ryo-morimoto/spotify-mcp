import type { TokenStorage, CodeChallengeStorage } from '../types/storage.ts';
import { createInMemoryTokenStorage, createInMemoryCodeChallengeStorage } from './memory.ts';

let tokenStorageInstance: TokenStorage | null = null;
let codeChallengeStorageInstance: CodeChallengeStorage | null = null;

export function getTokenStorage(): TokenStorage {
  // Use singleton in-memory storage for Node.js
  if (!tokenStorageInstance) {
    tokenStorageInstance = createInMemoryTokenStorage();
  }
  return tokenStorageInstance;
}

export function getCodeChallengeStorage(): CodeChallengeStorage {
  // Use in-memory storage for code challenges
  // as they are short-lived and don't need persistence
  if (!codeChallengeStorageInstance) {
    codeChallengeStorageInstance = createInMemoryCodeChallengeStorage();
  }
  return codeChallengeStorageInstance;
}
