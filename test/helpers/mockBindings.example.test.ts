/**
 * Example usage of mockBindings in tests
 * This file demonstrates how to use the mockBindings helper in your tests
 */

import { describe, test, expect, beforeEach } from "vitest";
import { createMockBindings, createMockBindingsWithOAuthState, getMockKV } from "./mockBindings.ts";
import { createMockKVWithData } from "./mockKV.ts";
import type { Bindings } from "../../src/types.ts";
import type { OAuthState } from "../../src/types.ts";

// Example function that uses Bindings
async function storeOAuthState(
  state: string,
  oauthState: OAuthState,
  bindings: Bindings,
): Promise<void> {
  const key = `oauth:state:${state}`;
  await bindings.OAUTH_KV.put(key, JSON.stringify(oauthState), { expirationTtl: 600 });
}

async function getOAuthState(state: string, bindings: Bindings): Promise<OAuthState | null> {
  const key = `oauth:state:${state}`;
  const data = await bindings.OAUTH_KV.get(key);

  if (!data) return null;

  return JSON.parse(data);
}

describe("OAuth State Management Example", () => {
  describe("Basic Usage", () => {
    test("stores and retrieves OAuth state", async () => {
      // Create mock bindings with default values
      const bindings = createMockBindings();

      const oauthState: OAuthState = {
        codeVerifier: "my-code-verifier",
        state: "my-state",
        redirectUri: "http://localhost:3000/callback",
        mcpSession: "session-123",
      };

      // Store OAuth state
      await storeOAuthState("my-state", oauthState, bindings);

      // Retrieve OAuth state
      const retrieved = await getOAuthState("my-state", bindings);
      expect(retrieved).toEqual(oauthState);

      // Access MockKVNamespace methods for verification
      const mockKV = getMockKV(bindings);
      expect(mockKV.put).toHaveBeenCalledWith("oauth:state:my-state", JSON.stringify(oauthState), {
        expirationTtl: 600,
      });
    });
  });

  describe("Custom Configuration", () => {
    test("uses custom bindings configuration", async () => {
      // Create bindings with custom values
      const bindings = createMockBindings({
        clientId: "my-spotify-client-id",
        spotifyRedirectUri: "https://myapp.com/auth/callback",
        corsOrigin: "https://myapp.com",
      });

      expect(bindings.CLIENT_ID).toBe("my-spotify-client-id");
      expect(bindings.SPOTIFY_REDIRECT_URI).toBe("https://myapp.com/auth/callback");
      expect(bindings.CORS_ORIGIN).toBe("https://myapp.com");
    });

    test("uses pre-populated KV data", async () => {
      // Create a mock KV with existing data
      const mockKV = createMockKVWithData({
        "oauth:state:existing-state": JSON.stringify({
          codeVerifier: "existing-verifier",
          state: "existing-state",
          redirectUri: "http://localhost:3000/callback",
        }),
      });

      // Create bindings with the pre-populated KV
      const bindings = createMockBindings({ oauthKV: mockKV });

      // Verify existing data is accessible
      const existing = await getOAuthState("existing-state", bindings);
      expect(existing?.codeVerifier).toBe("existing-verifier");
    });
  });

  describe("Pre-configured OAuth State", () => {
    test("uses bindings with pre-configured OAuth state", async () => {
      // Create bindings with default OAuth state
      const bindings = createMockBindingsWithOAuthState();

      // The default state is immediately available
      const defaultState = await getOAuthState("test-state", bindings);
      expect(defaultState).toEqual({
        codeVerifier: "test-code-verifier",
        state: "test-state",
        redirectUri: "http://localhost:3000/callback",
        mcpSession: "test-session-id",
      });

      // Mock history is cleared after setup (but get was called once above)
      const mockKV = getMockKV(bindings);
      expect(mockKV.get).toHaveBeenCalledTimes(1);
      expect(mockKV.put).not.toHaveBeenCalled(); // put wasn't called after initial setup
    });
  });

  describe("Testing with Mock Verification", () => {
    let bindings: Bindings;
    let mockKV: ReturnType<typeof getMockKV>;

    beforeEach(() => {
      bindings = createMockBindings();
      mockKV = getMockKV(bindings);
    });

    test("verifies KV operations", async () => {
      const state = "verification-state";
      const oauthState: OAuthState = {
        codeVerifier: "verifier",
        state,
        redirectUri: "http://localhost:3000/callback",
      };

      // Store state
      await storeOAuthState(state, oauthState, bindings);

      // Verify put was called correctly
      expect(mockKV.put).toHaveBeenCalledTimes(1);
      expect(mockKV.put).toHaveBeenCalledWith(`oauth:state:${state}`, JSON.stringify(oauthState), {
        expirationTtl: 600,
      });

      // Retrieve state
      await getOAuthState(state, bindings);

      // Verify get was called
      expect(mockKV.get).toHaveBeenCalledTimes(1);
      expect(mockKV.get).toHaveBeenCalledWith(`oauth:state:${state}`);

      // Clear mocks for next test
      mockKV.resetMocks();
      expect(mockKV.get).not.toHaveBeenCalled();
      expect(mockKV.put).not.toHaveBeenCalled();
    });

    test("tests TTL expiration", async () => {
      const state = "expiring-state";
      const oauthState: OAuthState = {
        codeVerifier: "expiring-verifier",
        state,
        redirectUri: "http://localhost:3000/callback",
      };

      // Store with 10 second TTL
      await bindings.OAUTH_KV.put(`oauth:state:${state}`, JSON.stringify(oauthState), {
        expirationTtl: 10,
      });

      // Verify it exists
      expect(await getOAuthState(state, bindings)).toEqual(oauthState);

      // Advance time by 11 seconds
      mockKV.advanceTime(11000);

      // Should be expired now
      expect(await getOAuthState(state, bindings)).toBeNull();
    });
  });
});
