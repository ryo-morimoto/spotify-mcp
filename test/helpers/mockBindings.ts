import type { Bindings } from "../../src/types.ts";
import { createMockKV, type MockKVNamespace } from "./mockKV.ts";

/**
 * Options for customizing mock bindings
 */
export type MockBindingsOptions = {
  clientId?: string;
  spotifyRedirectUri?: string;
  corsOrigin?: string;
  oauthKV?: MockKVNamespace;
};

/**
 * Mock bindings that provides access to MockKVNamespace utilities
 * The OAUTH_KV is cast to satisfy the Bindings interface while still
 * providing access to MockKVNamespace-specific methods
 */
export type MockBindings = Bindings;

/**
 * Creates mock bindings for testing
 *
 * @param options - Optional customization for bindings
 * @returns Mock bindings with properly typed values
 *
 * @example
 * ```typescript
 * const bindings = createMockBindings();
 *
 * // With custom values
 * const customBindings = createMockBindings({
 *   clientId: "custom-client-id",
 *   corsOrigin: "https://custom.example.com"
 * });
 *
 * // With pre-populated KV data
 * const mockKV = createMockKVWithData({
 *   "oauth:state:123": JSON.stringify({ codeVerifier: "verifier" })
 * });
 * const bindingsWithKV = createMockBindings({ oauthKV: mockKV });
 *
 * // Access MockKVNamespace methods
 * const mockKV = bindingsWithKV.OAUTH_KV as unknown as MockKVNamespace;
 * mockKV.getStoredValue("key");
 * ```
 */
export function createMockBindings(options: MockBindingsOptions = {}): MockBindings {
  const mockKV = options.oauthKV ?? createMockKV();

  return {
    CLIENT_ID: options.clientId ?? "test-client-id",
    SPOTIFY_REDIRECT_URI: options.spotifyRedirectUri ?? "http://localhost:3000/callback",
    CORS_ORIGIN: options.corsOrigin ?? "http://localhost:3000",
    OAUTH_KV: mockKV as any, // Type assertion needed due to KVNamespace's complex overloaded signatures
  };
}

/**
 * Creates mock bindings with default test data
 * Useful for tests that need common OAuth state
 */
export function createMockBindingsWithOAuthState(): MockBindings {
  const mockKV = createMockKV();

  // Add common OAuth state for testing
  const testState = {
    codeVerifier: "test-code-verifier",
    state: "test-state",
    redirectUri: "http://localhost:3000/callback",
    mcpSession: "test-session-id",
  };

  void mockKV.put("oauth:state:test-state", JSON.stringify(testState), { expirationTtl: 600 });

  // Reset mock history after setup
  mockKV.resetMocks();

  return createMockBindings({ oauthKV: mockKV });
}

/**
 * Helper to get MockKVNamespace from bindings
 * Provides type-safe access to MockKVNamespace methods
 *
 * @example
 * ```typescript
 * const bindings = createMockBindings();
 * const mockKV = getMockKV(bindings);
 *
 * // Now you can use MockKVNamespace methods
 * mockKV.getStoredValue("key");
 * mockKV.clear();
 * expect(mockKV.put).toHaveBeenCalled();
 * ```
 */
export function getMockKV(bindings: MockBindings): MockKVNamespace {
  return bindings.OAUTH_KV as unknown as MockKVNamespace;
}
