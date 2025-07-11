import { describe, it, expect } from "vitest";
import { createMockBindings, createMockBindingsWithOAuthState, getMockKV } from "./mockBindings.ts";
import { createMockKVWithData } from "./mockKV.ts";

describe("mockBindings", () => {
  describe("createMockBindings", () => {
    it("should create bindings with default values", () => {
      const bindings = createMockBindings();

      expect(bindings.CLIENT_ID).toBe("test-client-id");
      expect(bindings.SPOTIFY_REDIRECT_URI).toBe("http://localhost:3000/callback");
      expect(bindings.CORS_ORIGIN).toBe("http://localhost:3000");
      expect(bindings.OAUTH_KV).toBeDefined();
      expect(bindings.OAUTH_KV.get).toBeDefined();
      expect(bindings.OAUTH_KV.put).toBeDefined();
      expect(bindings.OAUTH_KV.delete).toBeDefined();
    });

    it("should allow customizing client ID", () => {
      const bindings = createMockBindings({
        clientId: "custom-client-id",
      });

      expect(bindings.CLIENT_ID).toBe("custom-client-id");
    });

    it("should allow customizing redirect URI", () => {
      const bindings = createMockBindings({
        spotifyRedirectUri: "https://example.com/callback",
      });

      expect(bindings.SPOTIFY_REDIRECT_URI).toBe("https://example.com/callback");
    });

    it("should allow customizing CORS origin", () => {
      const bindings = createMockBindings({
        corsOrigin: "https://custom.example.com",
      });

      expect(bindings.CORS_ORIGIN).toBe("https://custom.example.com");
    });

    it("should allow providing a custom KV instance", async () => {
      const mockKV = createMockKVWithData({
        "test-key": "test-value",
      });

      const bindings = createMockBindings({
        oauthKV: mockKV,
      });

      const value = await bindings.OAUTH_KV.get("test-key");
      expect(value).toBe("test-value");
    });

    it("should support all customization options at once", () => {
      const mockKV = createMockKVWithData({
        "custom-key": "custom-value",
      });

      const bindings = createMockBindings({
        clientId: "all-custom-client",
        spotifyRedirectUri: "https://all-custom.com/callback",
        corsOrigin: "https://all-custom.com",
        oauthKV: mockKV,
      });

      expect(bindings.CLIENT_ID).toBe("all-custom-client");
      expect(bindings.SPOTIFY_REDIRECT_URI).toBe("https://all-custom.com/callback");
      expect(bindings.CORS_ORIGIN).toBe("https://all-custom.com");
      expect(bindings.OAUTH_KV).toBe(mockKV);
    });
  });

  describe("createMockBindingsWithOAuthState", () => {
    it("should create bindings with pre-populated OAuth state", async () => {
      const bindings = createMockBindingsWithOAuthState();

      const storedState = await bindings.OAUTH_KV.get("oauth:state:test-state");
      expect(storedState).toBeDefined();

      const parsedState = JSON.parse(storedState!);
      expect(parsedState).toEqual({
        codeVerifier: "test-code-verifier",
        state: "test-state",
        redirectUri: "http://localhost:3000/callback",
        mcpSession: "test-session-id",
      });
    });

    it("should have cleared mock history after setup", () => {
      const bindings = createMockBindingsWithOAuthState();

      // Mock history should be clear
      expect(bindings.OAUTH_KV.put).not.toHaveBeenCalled();
      expect(bindings.OAUTH_KV.get).not.toHaveBeenCalled();
    });

    it("should use default binding values", () => {
      const bindings = createMockBindingsWithOAuthState();

      expect(bindings.CLIENT_ID).toBe("test-client-id");
      expect(bindings.SPOTIFY_REDIRECT_URI).toBe("http://localhost:3000/callback");
      expect(bindings.CORS_ORIGIN).toBe("http://localhost:3000");
    });
  });

  describe("type safety", () => {
    it("should satisfy the Bindings interface", () => {
      const bindings = createMockBindings();

      // This test ensures type compatibility at compile time
      const _typeCheck: import("../../src/types.ts").Bindings = bindings;
      expect(_typeCheck).toBe(bindings);
    });

    it("should provide MockKVNamespace methods via type assertion", () => {
      const bindings = createMockBindings();

      // Access MockKVNamespace methods via type assertion
      const mockKV = bindings.OAUTH_KV as unknown as import("./mockKV.ts").MockKVNamespace;

      // Verify MockKVNamespace-specific methods are available
      expect(typeof mockKV.getStoredValue).toBe("function");
      expect(typeof mockKV.clear).toBe("function");
      expect(typeof mockKV.resetMocks).toBe("function");
    });
  });

  describe("getMockKV helper", () => {
    it("should provide access to MockKVNamespace methods", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Test MockKVNamespace-specific functionality
      await mockKV.put("test-key", "test-value");

      expect(mockKV.getStoredValue("test-key")).toBe("test-value");
      expect(mockKV.put).toHaveBeenCalledWith("test-key", "test-value");

      mockKV.clear();
      expect(mockKV.getStoredValue("test-key")).toBeNull();
    });

    it("should work with createMockBindingsWithOAuthState", async () => {
      const bindings = createMockBindingsWithOAuthState();
      const mockKV = getMockKV(bindings);

      // Verify pre-populated OAuth state is accessible
      const storedState = mockKV.getStoredValue("oauth:state:test-state");
      expect(storedState).toBeDefined();

      const parsedState = JSON.parse(storedState!);
      expect(parsedState.codeVerifier).toBe("test-code-verifier");
    });
  });
});
