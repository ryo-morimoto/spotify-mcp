import { describe, test, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import authHandler from "./authHandler.ts";
import { createMockBindings, getMockKV, type MockBindings } from "../test/helpers/mockBindings.ts";
import { clientFixtures, createRegisteredClient } from "../test/fixtures/clients.ts";
import { expectResponse, expectOAuthError } from "../test/helpers/assertions.ts";
import type { Bindings } from "./types.ts";
import { ok, err } from "neverthrow";

// Mock the oauth.ts module
vi.mock("./oauth.ts", () => ({
  generateAuthorizationUrl: vi.fn(),
  exchangeCodeForTokens: vi.fn(),
}));

// Mock the clientRegistry.ts module
vi.mock("./oauth/clientRegistry.ts", () => ({
  registerClient: vi.fn(),
  getClient: vi.fn(),
  validateRedirectUri: vi.fn(),
}));

// Import mocked functions for type safety
import { registerClient, getClient, validateRedirectUri } from "./oauth/clientRegistry.ts";
import { generateAuthorizationUrl, exchangeCodeForTokens } from "./oauth.ts";

describe("authHandler", () => {
  let app: Hono<{ Bindings: Bindings }>;
  let mockBindings: MockBindings;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create fresh mock bindings
    mockBindings = createMockBindings();

    // Create a new Hono app with auth handler
    app = new Hono<{ Bindings: Bindings }>();
    app.route("/auth", authHandler);
  });

  describe("POST /register", () => {
    test("有効なクライアント情報でクライアントを登録し、登録情報を返す", async () => {
      // Arrange
      const registeredClient = createRegisteredClient({
        client_id: "test-client-id",
        client_name: clientFixtures.valid.client_name,
        redirect_uris: clientFixtures.valid.redirect_uris,
        created_at: Date.now(),
      });

      vi.mocked(registerClient).mockResolvedValue(ok(registeredClient));

      // Act
      const response = await app.request(
        "/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFixtures.valid),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(200).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toMatchObject({
        client_id: registeredClient.client_id,
        client_id_issued_at: Math.floor(registeredClient.created_at / 1000),
        grant_types: clientFixtures.valid.grant_types,
        response_types: clientFixtures.valid.response_types,
        redirect_uris: registeredClient.redirect_uris,
        token_endpoint_auth_method: clientFixtures.valid.token_endpoint_auth_method,
        client_name: registeredClient.client_name,
      });

      expect(vi.mocked(registerClient)).toHaveBeenCalledWith(
        mockBindings.OAUTH_KV,
        clientFixtures.valid,
      );
    });

    test("リクエストボディが無効なJSONの場合は400エラーを返す", async () => {
      // Arrange - no mocking needed for this test

      // Act
      const response = await app.request(
        "/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{ invalid json",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      await expectOAuthError(response).toBeInvalidRequest("Invalid JSON in request body");

      expect(vi.mocked(registerClient)).not.toHaveBeenCalled();
    });

    test("クライアント登録が失敗した場合は400エラーを返す", async () => {
      // Arrange
      const errorMessage = "Client name already exists";
      vi.mocked(registerClient).mockResolvedValue(err(errorMessage));

      // Act
      const response = await app.request(
        "/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFixtures.valid),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_client_metadata",
        error_description: errorMessage,
      });

      expect(vi.mocked(registerClient)).toHaveBeenCalledWith(
        mockBindings.OAUTH_KV,
        clientFixtures.valid,
      );
    });

    test("デフォルト値が適切に設定される", async () => {
      // Arrange
      const registeredClient = createRegisteredClient({
        client_id: "minimal-client-id",
        redirect_uris: clientFixtures.minimal.redirect_uris,
        created_at: Date.now(),
      });

      vi.mocked(registerClient).mockResolvedValue(ok(registeredClient));

      // Act
      const response = await app.request(
        "/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFixtures.minimal),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(200).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toMatchObject({
        client_id: registeredClient.client_id,
        client_id_issued_at: Math.floor(registeredClient.created_at / 1000),
        grant_types: ["authorization_code"], // Default value
        response_types: ["code"], // Default value
        redirect_uris: registeredClient.redirect_uris,
        token_endpoint_auth_method: "none", // Default value
      });

      // Should not include client_name if not provided
      expect(body).not.toHaveProperty("client_name");

      expect(vi.mocked(registerClient)).toHaveBeenCalledWith(
        mockBindings.OAUTH_KV,
        clientFixtures.minimal,
      );
    });
  });

  describe("GET /authorize", () => {
    test("有効なパラメータでHTML認証ページを表示する", async () => {
      // Arrange
      const clientId = "test-client-id";
      const redirectUri = "https://example.com/callback";
      const state = "test-state-123";
      const codeChallenge = "test-code-challenge";
      const codeChallengeMethod = "S256";

      const registeredClient = createRegisteredClient({
        client_id: clientId,
        redirect_uris: [redirectUri],
      });
      vi.mocked(getClient).mockResolvedValue(ok(registeredClient));
      vi.mocked(validateRedirectUri).mockReturnValue(ok(undefined));

      // Act
      const response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(200).toHaveContentType("text/html; charset=UTF-8");

      const html = await response.text();
      expect(html).toContain("Authorize Spotify MCP Server");
      expect(html).toContain("Connect with Spotify");
      expect(html).toContain(`/auth/spotify/connect?state=${state}`);
      expect(html).toContain(`${redirectUri}?error=access_denied&state=${state}`);

      expect(vi.mocked(getClient)).toHaveBeenCalledWith(mockBindings.OAUTH_KV, clientId);
      expect(vi.mocked(validateRedirectUri)).toHaveBeenCalledWith(registeredClient, redirectUri);
    });

    test("必須パラメータが不足している場合は400エラーを返す", async () => {
      // Test missing client_id
      let response = await app.request(
        "/auth/authorize?redirect_uri=https://example.com&state=test&code_challenge=test&code_challenge_method=S256",
        {
          method: "GET",
        },
        mockBindings,
      );
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Test missing redirect_uri
      response = await app.request(
        "/auth/authorize?client_id=test-client&state=test&code_challenge=test&code_challenge_method=S256",
        {
          method: "GET",
        },
        mockBindings,
      );
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Test missing state
      response = await app.request(
        "/auth/authorize?client_id=test-client&redirect_uri=https://example.com&code_challenge=test&code_challenge_method=S256",
        {
          method: "GET",
        },
        mockBindings,
      );
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Test missing code_challenge
      response = await app.request(
        "/auth/authorize?client_id=test-client&redirect_uri=https://example.com&state=test&code_challenge_method=S256",
        {
          method: "GET",
        },
        mockBindings,
      );
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Test missing code_challenge_method
      response = await app.request(
        "/auth/authorize?client_id=test-client&redirect_uri=https://example.com&state=test&code_challenge=test",
        {
          method: "GET",
        },
        mockBindings,
      );
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Ensure getClient was never called for any of these cases
      expect(vi.mocked(getClient)).not.toHaveBeenCalled();
    });

    test("codeChallengeMethodがS256以外の場合は400エラーを返す", async () => {
      // Arrange
      const clientId = "test-client-id";
      const redirectUri = "https://example.com/callback";
      const state = "test-state";
      const codeChallenge = "test-code-challenge";

      // Act - try with plain method
      let response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Act - try with invalid method
      response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=invalid`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing or invalid parameters");

      // Ensure getClient was never called
      expect(vi.mocked(getClient)).not.toHaveBeenCalled();
    });

    test("存在しないクライアントIDの場合は400エラーを返す", async () => {
      // Arrange
      const clientId = "non-existent-client";
      const redirectUri = "https://example.com/callback";
      const state = "test-state";
      const codeChallenge = "test-code-challenge";
      const codeChallengeMethod = "S256";

      vi.mocked(getClient).mockResolvedValue(ok(null));

      // Act
      const response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Invalid client");

      expect(vi.mocked(getClient)).toHaveBeenCalledWith(mockBindings.OAUTH_KV, clientId);
      expect(vi.mocked(validateRedirectUri)).not.toHaveBeenCalled();
    });

    test("無効なredirect_uriの場合は400エラーを返す", async () => {
      // Arrange
      const clientId = "test-client-id";
      const validRedirectUri = "https://example.com/callback";
      const invalidRedirectUri = "https://evil.com/callback";
      const state = "test-state";
      const codeChallenge = "test-code-challenge";
      const codeChallengeMethod = "S256";

      const registeredClient = createRegisteredClient({
        client_id: clientId,
        redirect_uris: [validRedirectUri], // Only this URI is registered
      });
      vi.mocked(getClient).mockResolvedValue(ok(registeredClient));
      vi.mocked(validateRedirectUri).mockReturnValue(err("Redirect URI not registered"));

      // Act
      const response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(invalidRedirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Invalid redirect URI");

      expect(vi.mocked(getClient)).toHaveBeenCalledWith(mockBindings.OAUTH_KV, clientId);
      expect(vi.mocked(validateRedirectUri)).toHaveBeenCalledWith(
        registeredClient,
        invalidRedirectUri,
      );
    });

    test("KVの取得でエラーが発生した場合は500エラーを返す", async () => {
      // Arrange
      const clientId = "test-client-id";
      const redirectUri = "https://example.com/callback";
      const state = "test-state";
      const codeChallenge = "test-code-challenge";
      const codeChallengeMethod = "S256";

      vi.mocked(getClient).mockResolvedValue(err("KV storage error"));

      // Act
      const response = await app.request(
        `/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(500);
      expect(await response.text()).toBe("Server error");

      expect(vi.mocked(getClient)).toHaveBeenCalledWith(mockBindings.OAUTH_KV, clientId);
      expect(vi.mocked(validateRedirectUri)).not.toHaveBeenCalled();
    });
  });

  describe("GET /spotify/connect", () => {
    test("有効なstateでSpotify認証URLにリダイレクトする", async () => {
      // Arrange
      const mcpState = "test-mcp-state-123";
      const spotifyState = "spotify-state-456";
      const authRequest = {
        clientId: "test-client-id",
        redirectUri: "https://example.com/callback",
        codeChallenge: "test-code-challenge",
        state: mcpState,
      };

      // Store authorization request in KV
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_request:${mcpState}`, JSON.stringify(authRequest));

      // Mock generateAuthorizationUrl
      const mockUrl = "https://accounts.spotify.com/authorize?params=test";
      vi.mocked(generateAuthorizationUrl).mockResolvedValue(
        ok({
          url: mockUrl,
          state: {
            codeVerifier: "test-code-verifier",
            state: spotifyState,
            redirectUri: mockBindings.SPOTIFY_REDIRECT_URI,
          },
        }),
      );

      // Act
      const response = await app.request(
        `/auth/spotify/connect?state=${mcpState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(302);
      expect(response.headers.get("Location")).toBe(mockUrl);

      expect(vi.mocked(generateAuthorizationUrl)).toHaveBeenCalledWith(
        mockBindings.CLIENT_ID,
        mockBindings.SPOTIFY_REDIRECT_URI,
        expect.arrayContaining([
          "user-read-private",
          "user-read-email",
          "playlist-read-private",
          "playlist-read-collaborative",
          "user-library-read",
          "user-top-read",
          "user-read-recently-played",
        ]),
      );
    });

    test("stateパラメータが不足している場合は400エラーを返す", async () => {
      // Act - no state parameter
      const response = await app.request(
        "/auth/spotify/connect",
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing state parameter");

      // Ensure generateAuthorizationUrl was never called
      expect(vi.mocked(generateAuthorizationUrl)).not.toHaveBeenCalled();
    });

    test("無効または期限切れのstateの場合は400エラーを返す", async () => {
      // Arrange
      const invalidState = "non-existent-state";

      // Act - state doesn't exist in KV
      const response = await app.request(
        `/auth/spotify/connect?state=${invalidState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Invalid or expired authorization request");

      // Ensure generateAuthorizationUrl was never called
      expect(vi.mocked(generateAuthorizationUrl)).not.toHaveBeenCalled();
    });

    test("Spotify認証URL生成に失敗した場合は500エラーを返す", async () => {
      // Arrange
      const mcpState = "test-mcp-state-error";
      const authRequest = {
        clientId: "test-client-id",
        redirectUri: "https://example.com/callback",
        codeChallenge: "test-code-challenge",
        state: mcpState,
      };

      // Store authorization request in KV
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_request:${mcpState}`, JSON.stringify(authRequest));

      // Mock generateAuthorizationUrl to return error
      vi.mocked(generateAuthorizationUrl).mockResolvedValue(
        err("Failed to generate code verifier"),
      );

      // Act
      const response = await app.request(
        `/auth/spotify/connect?state=${mcpState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(500);
      expect(await response.text()).toBe("Failed to generate authorization URL");

      expect(vi.mocked(generateAuthorizationUrl)).toHaveBeenCalledWith(
        mockBindings.CLIENT_ID,
        mockBindings.SPOTIFY_REDIRECT_URI,
        expect.any(Array),
      );

      // Ensure no Spotify state was stored
      const keys = mockKV.getAllKeys();
      const spotifyStateKeys = keys.filter((key) => key.startsWith("spotify_state:"));
      expect(spotifyStateKeys).toHaveLength(0);
    });
  });

  describe("GET /spotify/callback", () => {
    test("有効なコードとstateでMCP認可コードを生成しリダイレクトする", async () => {
      // Arrange
      const spotifyCode = "spotify-auth-code-123";
      const spotifyState = "spotify-state-456";
      const mcpState = "mcp-state-789";
      const mcpAuthCode = "mcp-auth-code-generated";
      const redirectUri = "https://example.com/callback";

      // Mock crypto.randomUUID to return controlled auth code
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = vi.fn().mockReturnValue(mcpAuthCode);

      // Set up state data in KV
      const stateData = {
        codeVerifier: "test-code-verifier",
        state: spotifyState,
        redirectUri: mockBindings.SPOTIFY_REDIRECT_URI,
        mcpState,
        authRequest: {
          clientId: "test-client-id",
          redirectUri,
          codeChallenge: "test-code-challenge",
          state: mcpState,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`spotify_state:${spotifyState}`, JSON.stringify(stateData));

      // Mock successful token exchange
      vi.mocked(exchangeCodeForTokens).mockResolvedValue(
        ok({
          accessToken: "spotify-access-token" as any,
          refreshToken: "spotify-refresh-token" as any,
          expiresIn: 3600,
        }),
      );

      // Act
      const response = await app.request(
        `/auth/spotify/callback?code=${spotifyCode}&state=${spotifyState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(302);

      // Verify redirect URL contains MCP auth code and state
      const location = response.headers.get("Location");
      expect(location).not.toBeNull();
      const redirectUrl = new URL(location!);
      expect(redirectUrl.origin + redirectUrl.pathname).toBe(redirectUri);
      expect(redirectUrl.searchParams.get("code")).toBe(mcpAuthCode);
      expect(redirectUrl.searchParams.get("state")).toBe(mcpState);

      // Verify exchangeCodeForTokens was called correctly
      expect(vi.mocked(exchangeCodeForTokens)).toHaveBeenCalledWith(
        mockBindings.CLIENT_ID,
        spotifyCode,
        stateData.codeVerifier,
        mockBindings.SPOTIFY_REDIRECT_URI,
      );

      // Restore original crypto.randomUUID
      crypto.randomUUID = originalRandomUUID;
    });

    test("Spotifyからエラーが返された場合は400エラーを返す", async () => {
      // Arrange
      const spotifyError = "access_denied";
      const spotifyState = "spotify-state-error";

      // Act - Spotify returns an error
      const response = await app.request(
        `/auth/spotify/callback?error=${spotifyError}&state=${spotifyState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe(`Spotify authorization error: ${spotifyError}`);

      // Ensure exchangeCodeForTokens was never called
      expect(vi.mocked(exchangeCodeForTokens)).not.toHaveBeenCalled();
    });

    test("codeパラメータが不足している場合は400エラーを返す", async () => {
      // Arrange
      const spotifyState = "spotify-state-no-code";

      // Act - missing code parameter
      const response = await app.request(
        `/auth/spotify/callback?state=${spotifyState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing code or state parameter");

      // Ensure exchangeCodeForTokens was never called
      expect(vi.mocked(exchangeCodeForTokens)).not.toHaveBeenCalled();
    });

    test("stateパラメータが不足している場合は400エラーを返す", async () => {
      // Arrange
      const spotifyCode = "spotify-auth-code-no-state";

      // Act - missing state parameter
      const response = await app.request(
        `/auth/spotify/callback?code=${spotifyCode}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Missing code or state parameter");

      // Ensure exchangeCodeForTokens was never called
      expect(vi.mocked(exchangeCodeForTokens)).not.toHaveBeenCalled();
    });

    test("無効または期限切れのstateの場合は400エラーを返す", async () => {
      // Arrange
      const spotifyCode = "spotify-auth-code-invalid-state";
      const invalidState = "invalid-spotify-state";

      // Act - state doesn't exist in KV
      const response = await app.request(
        `/auth/spotify/callback?code=${spotifyCode}&state=${invalidState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400);
      expect(await response.text()).toBe("Invalid or expired state");

      // Ensure exchangeCodeForTokens was never called
      expect(vi.mocked(exchangeCodeForTokens)).not.toHaveBeenCalled();
    });

    test("トークン交換に失敗した場合は500エラーを返す", async () => {
      // Arrange
      const spotifyCode = "spotify-auth-code-token-fail";
      const spotifyState = "spotify-state-token-fail";
      const mcpState = "mcp-state-token-fail";
      const errorMessage = "Network error during token exchange";

      // Set up state data in KV
      const stateData = {
        codeVerifier: "test-code-verifier",
        state: spotifyState,
        redirectUri: mockBindings.SPOTIFY_REDIRECT_URI,
        mcpState,
        authRequest: {
          clientId: "test-client-id",
          redirectUri: "https://example.com/callback",
          codeChallenge: "test-code-challenge",
          state: mcpState,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`spotify_state:${spotifyState}`, JSON.stringify(stateData));

      // Mock token exchange failure
      vi.mocked(exchangeCodeForTokens).mockResolvedValue(err(errorMessage));

      // Act
      const response = await app.request(
        `/auth/spotify/callback?code=${spotifyCode}&state=${spotifyState}`,
        {
          method: "GET",
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(500);
      expect(await response.text()).toBe(`Token exchange failed: ${errorMessage}`);

      // Verify exchangeCodeForTokens was called
      expect(vi.mocked(exchangeCodeForTokens)).toHaveBeenCalledWith(
        mockBindings.CLIENT_ID,
        spotifyCode,
        stateData.codeVerifier,
        stateData.redirectUri,
      );

      // Verify no auth code was stored
      const keys = mockKV.getAllKeys();
      const authCodeKeys = keys.filter((key) => key.startsWith("auth_code:"));
      expect(authCodeKeys).toHaveLength(0);

      // Verify temporary states were NOT cleaned up (error case)
      const authRequestData = await mockKV.get(`auth_request:${mcpState}`);
      expect(authRequestData).toBeNull(); // This should be null as it wasn't stored in this test

      const spotifyStateData = await mockKV.get(`spotify_state:${spotifyState}`);
      expect(spotifyStateData).not.toBeNull(); // This should still exist
    });
  });

  describe("POST /token", () => {
    test("有効な認可コードでアクセストークンを発行する", async () => {
      // Arrange
      const authCode = "test-auth-code";
      const clientId = "test-client-id";
      const redirectUri = "https://example.com/callback";
      const codeVerifier = "test-code-verifier";

      // Set up auth code data in KV
      const authData = {
        clientId,
        redirectUri,
        codeChallenge: "test-code-challenge",
        spotifyTokens: {
          accessToken: "spotify-access-token",
          refreshToken: "spotify-refresh-token",
          expiresAt: Date.now() + 3600000,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_code:${authCode}`, JSON.stringify(authData));

      // Mock client lookup
      const registeredClient = createRegisteredClient({
        client_id: clientId,
        redirect_uris: [redirectUri],
      });
      vi.mocked(getClient).mockResolvedValue(ok(registeredClient));

      // Act
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            code_verifier: codeVerifier,
            client_id: clientId,
            redirect_uri: redirectUri,
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(200).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toMatchObject({
        access_token: expect.any(String),
        token_type: "Bearer",
        expires_in: 3600,
        scope: expect.any(String),
      });

      // Verify auth code was deleted
      const deletedAuthCode = await mockKV.get(`auth_code:${authCode}`);
      expect(deletedAuthCode).toBeNull();

      // Verify MCP token was stored
      const mcpToken = await mockKV.get(`mcp_token:${body.access_token}`);
      expect(mcpToken).not.toBeNull();
      const tokenData = JSON.parse(mcpToken!);
      expect(tokenData).toMatchObject({
        clientId,
        spotifyTokens: authData.spotifyTokens,
        createdAt: expect.any(Number),
        expiresAt: expect.any(Number),
      });
    });

    test("grant_typeがauthorization_code以外の場合は400エラーを返す", async () => {
      // Act
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials", // Wrong grant type
            code: "test-code",
            code_verifier: "test-verifier",
            client_id: "test-client",
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      await expectOAuthError(response).toBeInvalidRequest("Missing required parameters");
    });

    test("必須パラメータが不足している場合は400エラーを返す", async () => {
      // Test missing code
      let response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            // code is missing
            code_verifier: "test-verifier",
            client_id: "test-client",
          }).toString(),
        },
        mockBindings,
      );

      expectResponse(response).toHaveStatus(400);
      await expectOAuthError(response).toBeInvalidRequest("Missing required parameters");

      // Test missing code_verifier
      response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: "test-code",
            // code_verifier is missing
            client_id: "test-client",
          }).toString(),
        },
        mockBindings,
      );

      expectResponse(response).toHaveStatus(400);
      await expectOAuthError(response).toBeInvalidRequest("Missing required parameters");

      // Test missing client_id
      response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: "test-code",
            code_verifier: "test-verifier",
            // client_id is missing
          }).toString(),
        },
        mockBindings,
      );

      expectResponse(response).toHaveStatus(400);
      await expectOAuthError(response).toBeInvalidRequest("Missing required parameters");
    });

    test("無効な認可コードの場合は400エラーを返す", async () => {
      // Arrange - auth code doesn't exist in KV
      const authCode = "invalid-auth-code";

      // Act
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            code_verifier: "test-verifier",
            client_id: "test-client",
            redirect_uri: "https://example.com/callback",
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_grant",
        error_description: "Invalid authorization code",
      });
    });

    test("client_idが一致しない場合は400エラーを返す", async () => {
      // Arrange
      const authCode = "test-auth-code";
      const authData = {
        clientId: "original-client-id",
        redirectUri: "https://example.com/callback",
        codeChallenge: "test-code-challenge",
        spotifyTokens: {
          accessToken: "spotify-access-token",
          refreshToken: "spotify-refresh-token",
          expiresAt: Date.now() + 3600000,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_code:${authCode}`, JSON.stringify(authData));

      // Act - using different client_id
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            code_verifier: "test-verifier",
            client_id: "different-client-id",
            redirect_uri: authData.redirectUri,
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_grant",
        error_description: "Client mismatch",
      });
    });

    test("redirect_uriが一致しない場合は400エラーを返す", async () => {
      // Arrange
      const authCode = "test-auth-code";
      const authData = {
        clientId: "test-client-id",
        redirectUri: "https://example.com/callback",
        codeChallenge: "test-code-challenge",
        spotifyTokens: {
          accessToken: "spotify-access-token",
          refreshToken: "spotify-refresh-token",
          expiresAt: Date.now() + 3600000,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_code:${authCode}`, JSON.stringify(authData));

      // Act - using different redirect_uri
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            code_verifier: "test-verifier",
            client_id: authData.clientId,
            redirect_uri: "https://different.com/callback",
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_grant",
        error_description: "Client mismatch",
      });
    });

    test("クライアントが存在しない場合は400エラーを返す", async () => {
      // Arrange
      const authCode = "test-auth-code";
      const clientId = "non-existent-client";
      const authData = {
        clientId,
        redirectUri: "https://example.com/callback",
        codeChallenge: "test-code-challenge",
        spotifyTokens: {
          accessToken: "spotify-access-token",
          refreshToken: "spotify-refresh-token",
          expiresAt: Date.now() + 3600000,
        },
      };
      const mockKV = getMockKV(mockBindings);
      await mockKV.put(`auth_code:${authCode}`, JSON.stringify(authData));

      // Mock client lookup to return null
      vi.mocked(getClient).mockResolvedValue(ok(null));

      // Act
      const response = await app.request(
        "/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            code_verifier: "test-verifier",
            client_id: clientId,
            redirect_uri: authData.redirectUri,
          }).toString(),
        },
        mockBindings,
      );

      // Assert
      expectResponse(response).toHaveStatus(400).toHaveContentType("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_client",
        error_description: "Client not found",
      });
    });
  });
});
