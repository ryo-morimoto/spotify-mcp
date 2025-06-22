import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryTokenStorage, createInMemoryCodeChallengeStorage } from './memory.ts';
import type { TokenData, CodeChallengeData } from '../types/storage.ts';

describe('In-Memory Storage', () => {
  describe('TokenStorage', () => {
    let storage: ReturnType<typeof createInMemoryTokenStorage>;
    const userId = 'test-user';
    const tokenData: TokenData = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      tokenType: 'Bearer',
      scope: 'user-read-playback-state',
    };

    beforeEach(() => {
      storage = createInMemoryTokenStorage();
    });

    describe('store', () => {
      it('should store tokens successfully', async () => {
        const result = await storage.store(userId, tokenData);

        expect(result.isOk()).toBe(true);
      });

      it('should overwrite existing tokens for the same user', async () => {
        const newTokenData: TokenData = {
          ...tokenData,
          accessToken: 'new-access-token',
        };

        await storage.store(userId, tokenData);
        const result = await storage.store(userId, newTokenData);

        expect(result.isOk()).toBe(true);

        const getResult = await storage.get(userId);
        if (getResult.isOk() && getResult.value) {
          expect(getResult.value.accessToken).toBe('new-access-token');
        }
      });
    });

    describe('get', () => {
      it('should return null for non-existent user', async () => {
        const result = await storage.get('non-existent-user');

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeNull();
        }
      });

      it('should return stored tokens', async () => {
        await storage.store(userId, tokenData);
        const result = await storage.get(userId);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(tokenData);
        }
      });

      it('should handle multiple users independently', async () => {
        const user2 = 'test-user-2';
        const tokenData2: TokenData = {
          ...tokenData,
          accessToken: 'user2-access-token',
        };

        await storage.store(userId, tokenData);
        await storage.store(user2, tokenData2);

        const result1 = await storage.get(userId);
        const result2 = await storage.get(user2);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        if (result1.isOk() && result1.value) {
          expect(result1.value.accessToken).toBe('test-access-token');
        }
        if (result2.isOk() && result2.value) {
          expect(result2.value.accessToken).toBe('user2-access-token');
        }
      });
    });

    describe('clear', () => {
      it('should clear tokens for specific user', async () => {
        await storage.store(userId, tokenData);
        const clearResult = await storage.clear(userId);

        expect(clearResult.isOk()).toBe(true);

        const getResult = await storage.get(userId);
        expect(getResult.isOk()).toBe(true);
        if (getResult.isOk()) {
          expect(getResult.value).toBeNull();
        }
      });

      it('should not affect other users when clearing', async () => {
        const user2 = 'test-user-2';
        const tokenData2: TokenData = {
          ...tokenData,
          accessToken: 'user2-access-token',
        };

        await storage.store(userId, tokenData);
        await storage.store(user2, tokenData2);
        await storage.clear(userId);

        const result1 = await storage.get(userId);
        const result2 = await storage.get(user2);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        if (result1.isOk()) {
          expect(result1.value).toBeNull();
        }
        if (result2.isOk() && result2.value) {
          expect(result2.value.accessToken).toBe('user2-access-token');
        }
      });

      it('should handle clearing non-existent user gracefully', async () => {
        const result = await storage.clear('non-existent-user');

        expect(result.isOk()).toBe(true);
      });
    });
  });

  describe('CodeChallengeStorage', () => {
    let storage: ReturnType<typeof createInMemoryCodeChallengeStorage>;
    const state = 'test-state-123';
    const challengeData: CodeChallengeData = {
      codeVerifier: 'test-verifier',
      codeChallenge: 'test-challenge',
      expiresAt: Date.now() + 600000, // 10 minutes from now
    };

    beforeEach(() => {
      storage = createInMemoryCodeChallengeStorage();
    });

    describe('store', () => {
      it('should store code challenge successfully', async () => {
        const result = await storage.store(state, challengeData);

        expect(result.isOk()).toBe(true);
      });

      it('should overwrite existing challenge for the same state', async () => {
        const newChallengeData: CodeChallengeData = {
          ...challengeData,
          codeVerifier: 'new-verifier',
        };

        await storage.store(state, challengeData);
        const result = await storage.store(state, newChallengeData);

        expect(result.isOk()).toBe(true);

        const getResult = await storage.get(state);
        if (getResult.isOk() && getResult.value) {
          expect(getResult.value.codeVerifier).toBe('new-verifier');
        }
      });
    });

    describe('get', () => {
      it('should return null for non-existent state', async () => {
        const result = await storage.get('non-existent-state');

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeNull();
        }
      });

      it('should return stored challenge', async () => {
        await storage.store(state, challengeData);
        const result = await storage.get(state);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(challengeData);
        }
      });

      it('should return null for expired challenge', async () => {
        const expiredChallenge: CodeChallengeData = {
          ...challengeData,
          expiresAt: Date.now() - 1000, // Expired 1 second ago
        };

        await storage.store(state, expiredChallenge);
        const result = await storage.get(state);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeNull();
        }
      });

      it('should auto-delete expired challenges', async () => {
        const expiredChallenge: CodeChallengeData = {
          ...challengeData,
          expiresAt: Date.now() - 1000, // Expired 1 second ago
        };

        await storage.store(state, expiredChallenge);
        await storage.get(state); // This should trigger auto-deletion

        // Even calling get again should return null
        const result = await storage.get(state);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeNull();
        }
      });

      it('should handle multiple states independently', async () => {
        const state2 = 'test-state-456';
        const challengeData2: CodeChallengeData = {
          ...challengeData,
          codeVerifier: 'verifier-2',
        };

        await storage.store(state, challengeData);
        await storage.store(state2, challengeData2);

        const result1 = await storage.get(state);
        const result2 = await storage.get(state2);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        if (result1.isOk() && result1.value) {
          expect(result1.value.codeVerifier).toBe('test-verifier');
        }
        if (result2.isOk() && result2.value) {
          expect(result2.value.codeVerifier).toBe('verifier-2');
        }
      });
    });

    describe('clear', () => {
      it('should clear challenge for specific state', async () => {
        await storage.store(state, challengeData);
        const clearResult = await storage.clear(state);

        expect(clearResult.isOk()).toBe(true);

        const getResult = await storage.get(state);
        expect(getResult.isOk()).toBe(true);
        if (getResult.isOk()) {
          expect(getResult.value).toBeNull();
        }
      });

      it('should not affect other states when clearing', async () => {
        const state2 = 'test-state-456';
        const challengeData2: CodeChallengeData = {
          ...challengeData,
          codeVerifier: 'verifier-2',
        };

        await storage.store(state, challengeData);
        await storage.store(state2, challengeData2);
        await storage.clear(state);

        const result1 = await storage.get(state);
        const result2 = await storage.get(state2);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        if (result1.isOk()) {
          expect(result1.value).toBeNull();
        }
        if (result2.isOk() && result2.value) {
          expect(result2.value.codeVerifier).toBe('verifier-2');
        }
      });

      it('should handle clearing non-existent state gracefully', async () => {
        const result = await storage.clear('non-existent-state');

        expect(result.isOk()).toBe(true);
      });
    });
  });
});
