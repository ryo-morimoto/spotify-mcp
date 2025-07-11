import { describe, it, expect, vi } from "vitest";
import app from "../../src/index.ts";
import { createMockBindings, getMockKV } from "../helpers/mockBindings.ts";
import { generateCodeVerifier, generateCodeChallenge } from "../../src/pkce.ts";
import { SPOTIFY_SCOPES } from "../../src/constants.ts";

// Mock only the external Spotify API calls
vi.mock("../../src/oauth.ts", async () => {
  const actual = await vi.importActual<typeof import("../../src/oauth.ts")>("../../src/oauth.ts");
  return {
    ...actual,
    exchangeCodeForTokens: vi.fn().mockImplementation(async () => {
      // Simulate successful token exchange
      return {
        isOk: () => true,
        isErr: () => false,
        value: {
          accessToken: "mock-spotify-access-token",
          refreshToken: "mock-spotify-refresh-token",
          expiresIn: 3600,
        },
      };
    }),
  };
});

describe("OAuth Flow Integration Tests", () => {
  describe("Complete OAuth flow", () => {
    it("should handle complete authorization flow from start to finish", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Step 1: Register a client
      const registerReq = new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Test OAuth Client",
          redirect_uris: ["http://localhost:3000/callback"],
          grant_types: ["authorization_code"],
          response_types: ["code"],
        }),
      });

      const registerRes = await app.fetch(registerReq, bindings);
      expect(registerRes.status).toBe(200);
      const { client_id } = await registerRes.json();

      // Step 2: Generate PKCE parameters
      const codeVerifierResult = generateCodeVerifier();
      if (codeVerifierResult.isErr()) {
        throw new Error("Failed to generate code verifier");
      }
      const codeVerifier = codeVerifierResult.value;

      const codeChallengeResult = await generateCodeChallenge(codeVerifier);
      if (codeChallengeResult.isErr()) {
        throw new Error("Failed to generate code challenge");
      }
      const codeChallenge = codeChallengeResult.value;

      const state = "test-state-123";

      // Step 3: Request authorization
      const authReq = new Request(
        `http://localhost/auth/authorize?` +
          `client_id=${client_id}&` +
          `redirect_uri=${encodeURIComponent("http://localhost:3000/callback")}&` +
          `state=${state}&` +
          `code_challenge=${codeChallenge}&` +
          `code_challenge_method=S256`,
      );

      const authRes = await app.fetch(authReq, bindings);
      expect(authRes.status).toBe(200);
      expect(authRes.headers.get("Content-Type")).toContain("text/html");

      // Verify auth request was stored
      const authRequestData = await mockKV.get(`auth_request:${state}`);
      expect(authRequestData).toBeTruthy();

      // Step 4: User clicks "Connect with Spotify"
      const spotifyConnectReq = new Request(`http://localhost/auth/spotify/connect?state=${state}`);

      const spotifyConnectRes = await app.fetch(spotifyConnectReq, bindings);
      expect(spotifyConnectRes.status).toBe(302); // Redirect to Spotify

      const locationHeader = spotifyConnectRes.headers.get("Location");
      expect(locationHeader).toContain("https://accounts.spotify.com/authorize");

      // Extract Spotify state from redirect URL
      const spotifyUrl = new URL(locationHeader!);
      const spotifyState = spotifyUrl.searchParams.get("state");
      expect(spotifyState).toBeTruthy();

      // Step 5: Simulate Spotify callback with authorization code
      const spotifyCode = "mock-spotify-auth-code";
      const callbackReq = new Request(
        `http://localhost/auth/spotify/callback?` +
          `code=${spotifyCode}&` +
          `state=${spotifyState}`,
      );

      const callbackRes = await app.fetch(callbackReq, bindings);
      expect(callbackRes.status).toBe(302); // Redirect back to client

      const clientRedirect = new URL(callbackRes.headers.get("Location")!);
      expect(clientRedirect.origin + clientRedirect.pathname).toBe(
        "http://localhost:3000/callback",
      );

      const mcpAuthCode = clientRedirect.searchParams.get("code");
      expect(mcpAuthCode).toBeTruthy();
      expect(clientRedirect.searchParams.get("state")).toBe(state);

      // Step 6: Exchange MCP auth code for access token
      const tokenReq = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: mcpAuthCode!,
          code_verifier: codeVerifier,
          client_id: client_id,
          redirect_uri: "http://localhost:3000/callback",
        }).toString(),
      });

      const tokenRes = await app.fetch(tokenReq, bindings);
      expect(tokenRes.status).toBe(200);

      const tokenData = await tokenRes.json();
      expect(tokenData).toMatchObject({
        access_token: expect.any(String),
        token_type: "Bearer",
        expires_in: 3600,
        scope: SPOTIFY_SCOPES.join(" "),
      });

      // Step 7: Verify the access token works with MCP endpoint
      const mcpReq = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          id: 1,
        }),
      });

      const mcpRes = await app.fetch(mcpReq, bindings);
      // Should not be unauthorized
      expect(mcpRes.status).not.toBe(401);

      // Verify token data is stored correctly
      const storedToken = await mockKV.get(`mcp_token:${tokenData.access_token}`);
      expect(storedToken).toBeTruthy();
      const parsed = JSON.parse(storedToken!);
      expect(parsed.clientId).toBe(client_id);
      expect(parsed.spotifyTokens).toMatchObject({
        accessToken: "mock-spotify-access-token",
        refreshToken: "mock-spotify-refresh-token",
      });
    });
  });

  describe("Error handling in OAuth flow", () => {
    it("should handle user cancellation", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Setup: Register client and create auth request
      await mockKV.put(
        "client:test-client",
        JSON.stringify({
          client_id: "test-client",
          redirect_uris: ["http://localhost:3000/callback"],
          created_at: Date.now(),
        }),
      );

      const state = "cancel-test-state";
      await mockKV.put(
        `auth_request:${state}`,
        JSON.stringify({
          clientId: "test-client",
          redirectUri: "http://localhost:3000/callback",
          codeChallenge: "test-challenge",
          state,
        }),
      );

      // Simulate user clicking cancel on authorization page
      // The cancel link should redirect with error
      const expectedUrl = `http://localhost:3000/callback?error=access_denied&state=${state}`;

      // Verify the cancel URL is correct in the authorization page
      const authReq = new Request(
        `http://localhost/auth/authorize?` +
          `client_id=test-client&` +
          `redirect_uri=http://localhost:3000/callback&` +
          `state=${state}&` +
          `code_challenge=test-challenge&` +
          `code_challenge_method=S256`,
      );

      const authRes = await app.fetch(authReq, bindings);
      const html = await authRes.text();
      expect(html).toContain(expectedUrl);
    });

    it("should handle Spotify OAuth error", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Setup Spotify state
      const spotifyState = "spotify-error-state";
      await mockKV.put(
        `spotify_state:${spotifyState}`,
        JSON.stringify({
          codeVerifier: "verifier",
          redirectUri: "http://localhost:8787/auth/spotify/callback",
          mcpState: "mcp-state",
          authRequest: {
            clientId: "test-client",
            redirectUri: "http://localhost:3000/callback",
          },
        }),
      );

      // Simulate Spotify callback with error
      const callbackReq = new Request(
        `http://localhost/auth/spotify/callback?` +
          `error=access_denied&` +
          `state=${spotifyState}`,
      );

      const callbackRes = await app.fetch(callbackReq, bindings);
      expect(callbackRes.status).toBe(400);
      expect(await callbackRes.text()).toBe("Spotify authorization error: access_denied");
    });

    it("should handle expired state during callback", async () => {
      const bindings = createMockBindings();

      // Simulate callback with non-existent state
      const callbackReq = new Request(
        `http://localhost/auth/spotify/callback?` + `code=some-code&` + `state=non-existent-state`,
      );

      const callbackRes = await app.fetch(callbackReq, bindings);
      expect(callbackRes.status).toBe(400);
      expect(await callbackRes.text()).toBe("Invalid or expired state");
    });

    it("should handle invalid authorization code", async () => {
      const bindings = createMockBindings();

      // Try to exchange non-existent auth code
      const tokenReq = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "invalid-code",
          code_verifier: "some-verifier",
          client_id: "test-client",
          redirect_uri: "http://localhost:3000/callback",
        }).toString(),
      });

      const tokenRes = await app.fetch(tokenReq, bindings);
      expect(tokenRes.status).toBe(400);

      const errorData = await tokenRes.json();
      expect(errorData.error).toBe("invalid_grant");
      expect(errorData.error_description).toBe("Invalid authorization code");
    });

    it("should handle client_id mismatch in token exchange", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Store auth code for different client
      const authCode = "mismatch-test-code";
      await mockKV.put(
        `auth_code:${authCode}`,
        JSON.stringify({
          clientId: "original-client",
          redirectUri: "http://localhost:3000/callback",
          codeChallenge: "challenge",
          spotifyTokens: {
            accessToken: "token",
            refreshToken: "refresh",
            expiresAt: Date.now() + 3600000,
          },
        }),
      );

      // Try to exchange with different client_id
      const tokenReq = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          code_verifier: "verifier",
          client_id: "different-client",
          redirect_uri: "http://localhost:3000/callback",
        }).toString(),
      });

      const tokenRes = await app.fetch(tokenReq, bindings);
      expect(tokenRes.status).toBe(400);

      const errorData = await tokenRes.json();
      expect(errorData.error).toBe("invalid_grant");
      expect(errorData.error_description).toBe("Client mismatch");
    });

    it("should reject token request with missing parameters", async () => {
      const bindings = createMockBindings();

      const tokenReq = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          // Missing required parameters
        }).toString(),
      });

      const tokenRes = await app.fetch(tokenReq, bindings);
      expect(tokenRes.status).toBe(400);

      const errorData = await tokenRes.json();
      expect(errorData.error).toBe("invalid_request");
      expect(errorData.error_description).toBe("Missing required parameters");
    });

    it("should reject unsupported grant type", async () => {
      const bindings = createMockBindings();

      const tokenReq = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password", // Unsupported
          username: "user",
          password: "pass",
        }).toString(),
      });

      const tokenRes = await app.fetch(tokenReq, bindings);
      expect(tokenRes.status).toBe(400);

      const errorData = await tokenRes.json();
      expect(errorData.error).toBe("invalid_request");
    });
  });

  describe("Authorization code lifecycle", () => {
    it("should prevent authorization code reuse", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Setup valid auth code
      const authCode = "one-time-use-code";
      const authData = {
        clientId: "test-client",
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "challenge",
        spotifyTokens: {
          accessToken: "spotify-token",
          refreshToken: "refresh-token",
          expiresAt: Date.now() + 3600000,
        },
      };

      await mockKV.put(`auth_code:${authCode}`, JSON.stringify(authData));

      // Register the client
      await mockKV.put(
        "client:test-client",
        JSON.stringify({
          client_id: "test-client",
          redirect_uris: ["http://localhost:3000/callback"],
          created_at: Date.now(),
        }),
      );

      // First exchange should succeed
      const tokenReq1 = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          code_verifier: "verifier",
          client_id: "test-client",
          redirect_uri: "http://localhost:3000/callback",
        }).toString(),
      });

      const tokenRes1 = await app.fetch(tokenReq1, bindings);
      expect(tokenRes1.status).toBe(200);

      // Second exchange should fail (code already used)
      const tokenReq2 = new Request("http://localhost/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          code_verifier: "verifier",
          client_id: "test-client",
          redirect_uri: "http://localhost:3000/callback",
        }).toString(),
      });

      const tokenRes2 = await app.fetch(tokenReq2, bindings);
      expect(tokenRes2.status).toBe(400);

      const errorData = await tokenRes2.json();
      expect(errorData.error).toBe("invalid_grant");
    });
  });

  describe("Client registration validation", () => {
    it("should validate redirect_uris format", async () => {
      const bindings = createMockBindings();

      const req = new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Invalid URI Client",
          redirect_uris: ["not-a-valid-uri"],
        }),
      });

      const res = await app.fetch(req, bindings);
      expect(res.status).toBe(400);

      const errorData = await res.json();
      expect(errorData.error).toBe("invalid_client_metadata");
    });

    it("should require at least one redirect_uri", async () => {
      const bindings = createMockBindings();

      const req = new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "No Redirect Client",
          redirect_uris: [],
        }),
      });

      const res = await app.fetch(req, bindings);
      expect(res.status).toBe(400);

      const errorData = await res.json();
      expect(errorData.error).toBe("invalid_client_metadata");
    });
  });

  describe("State parameter validation", () => {
    it("should preserve state parameter through entire flow", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Register client
      await mockKV.put(
        "client:state-test-client",
        JSON.stringify({
          client_id: "state-test-client",
          redirect_uris: ["http://localhost:3000/callback"],
          created_at: Date.now(),
        }),
      );

      const originalState = "my-unique-state-123";
      const codeChallenge = "test-challenge";

      // Start authorization
      const authReq = new Request(
        `http://localhost/auth/authorize?` +
          `client_id=state-test-client&` +
          `redirect_uri=http://localhost:3000/callback&` +
          `state=${originalState}&` +
          `code_challenge=${codeChallenge}&` +
          `code_challenge_method=S256`,
      );

      await app.fetch(authReq, bindings);

      // Verify state is preserved in storage
      const storedAuth = await mockKV.get(`auth_request:${originalState}`);
      expect(storedAuth).toBeTruthy();
      const authData = JSON.parse(storedAuth!);
      expect(authData.state).toBe(originalState);

      // Simulate Spotify connect
      const connectReq = new Request(
        `http://localhost/auth/spotify/connect?state=${originalState}`,
      );

      const connectRes = await app.fetch(connectReq, bindings);
      const spotifyUrl = new URL(connectRes.headers.get("Location")!);
      const spotifyState = spotifyUrl.searchParams.get("state");

      // Verify mapping is stored
      const spotifyStateData = await mockKV.get(`spotify_state:${spotifyState}`);
      expect(spotifyStateData).toBeTruthy();
      const stateMapping = JSON.parse(spotifyStateData!);
      expect(stateMapping.mcpState).toBe(originalState);

      // Complete flow and verify state is returned to client
      await mockKV.put(
        `spotify_state:${spotifyState}`,
        JSON.stringify({
          ...stateMapping,
          codeVerifier: "verifier",
          redirectUri: bindings.SPOTIFY_REDIRECT_URI,
        }),
      );

      const callbackReq = new Request(
        `http://localhost/auth/spotify/callback?` + `code=test-code&` + `state=${spotifyState}`,
      );

      const callbackRes = await app.fetch(callbackReq, bindings);
      const finalRedirect = new URL(callbackRes.headers.get("Location")!);

      // Original state should be preserved
      expect(finalRedirect.searchParams.get("state")).toBe(originalState);
    });
  });
});
