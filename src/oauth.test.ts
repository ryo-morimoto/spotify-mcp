import { describe, it, expect, beforeEach, vi } from "vitest";
import { ok, err } from "neverthrow";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  createSpotifyClientWithRefresh,
} from "./oauth.ts";
import * as pkce from "./pkce.ts";
import type { SpotifyClientId, SpotifyAccessToken, SpotifyRefreshToken } from "./types.ts";
import { tokenFixtures } from "../test/fixtures/tokens.ts";
import { expectResult } from "../test/helpers/assertions.ts";

// Mock modules
vi.mock("./pkce.ts", () => ({
  generateCodeVerifier: vi.fn(),
  generateCodeChallenge: vi.fn(),
}));

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn();
vi.stubGlobal("crypto", {
  randomUUID: mockRandomUUID,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("oauth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomUUID.mockReturnValue("test-state-uuid");
  });

  describe("generateAuthorizationUrl", () => {
    it("正常に認証URLとstateを生成する", async () => {
      // Arrange
      const clientId = "test-client-id" as SpotifyClientId;
      const redirectUri = "http://localhost:3000/callback";
      const scopes = ["user-read-private", "user-read-email"];

      vi.mocked(pkce.generateCodeVerifier).mockReturnValue(ok(tokenFixtures.pkce.codeVerifier));
      vi.mocked(pkce.generateCodeChallenge).mockResolvedValue(ok(tokenFixtures.pkce.codeChallenge));

      // Act
      const result = await generateAuthorizationUrl(clientId, redirectUri, scopes);

      // Assert
      const { url, state } = expectResult(result).toBeOk();

      expect(url).toContain("https://accounts.spotify.com/authorize");
      expect(url).toContain(`client_id=${clientId}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`code_challenge=${tokenFixtures.pkce.codeChallenge}`);
      expect(url).toContain("code_challenge_method=S256");
      expect(url).toContain("response_type=code");
      expect(url).toContain(`scope=${scopes.join("+")}`); // URLSearchParams uses + for spaces
      expect(url).toContain(`state=test-state-uuid`);

      expect(state).toEqual({
        codeVerifier: tokenFixtures.pkce.codeVerifier,
        state: "test-state-uuid",
        redirectUri,
      });
    });

    it("code verifier生成に失敗した場合はエラーを返す", async () => {
      // Arrange
      vi.mocked(pkce.generateCodeVerifier).mockReturnValue(
        err("Verifier generation failed") as any,
      );

      // Act
      const result = await generateAuthorizationUrl(
        "test-client-id" as SpotifyClientId,
        "http://localhost:3000/callback",
        ["user-read-private"],
      );

      // Assert
      expectResult(result).toHaveError("Failed to generate code verifier");
    });

    it("code challenge生成に失敗した場合はエラーを返す", async () => {
      // Arrange
      vi.mocked(pkce.generateCodeVerifier).mockReturnValue(ok(tokenFixtures.pkce.codeVerifier));
      vi.mocked(pkce.generateCodeChallenge).mockResolvedValue(
        err("Challenge generation failed") as any,
      );

      // Act
      const result = await generateAuthorizationUrl(
        "test-client-id" as SpotifyClientId,
        "http://localhost:3000/callback",
        ["user-read-private"],
      );

      // Assert
      expectResult(result).toHaveError("Failed to generate code challenge");
    });
  });

  describe("exchangeCodeForTokens", () => {
    const clientId = "test-client-id" as SpotifyClientId;
    const code = "test-auth-code";
    const codeVerifier = tokenFixtures.pkce.codeVerifier;
    const redirectUri = "http://localhost:3000/callback";

    it("正常にトークンを交換する", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => tokenFixtures.spotifyTokenResponses.standard,
      });

      // Act
      const result = await exchangeCodeForTokens(clientId, code, codeVerifier, redirectUri);

      // Assert
      const tokens = expectResult(result).toBeOk();
      expect(tokens).toEqual({
        accessToken: tokenFixtures.spotifyTokenResponses.standard.access_token,
        refreshToken: tokenFixtures.spotifyTokenResponses.standard.refresh_token,
        expiresIn: tokenFixtures.spotifyTokenResponses.standard.expires_in,
      });

      expect(mockFetch).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: expect.stringContaining("grant_type=authorization_code"),
      });
    });

    it("Spotifyがエラーレスポンスを返した場合はエラーを返す", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            error: "invalid_grant",
            error_description: "Invalid authorization code",
          }),
      });

      // Act
      const result = await exchangeCodeForTokens(clientId, code, codeVerifier, redirectUri);

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Token exchange failed: 400");
      expect(error).toContain("invalid_grant");
    });

    it("ネットワークエラーが発生した場合はエラーを返す", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Act
      const result = await exchangeCodeForTokens(clientId, code, codeVerifier, redirectUri);

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Failed to exchange code for tokens");
      expect(error).toContain("Network error");
    });

    it("レスポンスのJSONパースに失敗した場合はエラーを返す", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      // Act
      const result = await exchangeCodeForTokens(clientId, code, codeVerifier, redirectUri);

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Failed to exchange code for tokens");
      expect(error).toContain("Invalid JSON");
    });
  });

  describe("refreshAccessToken", () => {
    const clientId = "test-client-id" as SpotifyClientId;
    const refreshToken = tokenFixtures.validRefreshToken as SpotifyRefreshToken;

    it("正常にアクセストークンをリフレッシュする", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => tokenFixtures.spotifyTokenResponses.standard,
      });

      // Act
      const result = await refreshAccessToken(clientId, refreshToken);

      // Assert
      const tokens = expectResult(result).toBeOk();
      expect(tokens).toEqual({
        accessToken: tokenFixtures.spotifyTokenResponses.standard.access_token,
        refreshToken: tokenFixtures.spotifyTokenResponses.standard.refresh_token,
        expiresIn: tokenFixtures.spotifyTokenResponses.standard.expires_in,
      });

      expect(mockFetch).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: expect.stringContaining("grant_type=refresh_token"),
      });
    });

    it("新しいrefresh_tokenが返されない場合は既存のものを保持する", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => tokenFixtures.spotifyTokenResponses.withoutRefreshToken,
      });

      // Act
      const result = await refreshAccessToken(clientId, refreshToken);

      // Assert
      const tokens = expectResult(result).toBeOk();
      expect(tokens.refreshToken).toBe(refreshToken); // 既存のrefreshTokenを保持
    });

    it("リフレッシュトークンが無効な場合はエラーを返す", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({ error: "invalid_grant", error_description: "Refresh token revoked" }),
      });

      // Act
      const result = await refreshAccessToken(clientId, refreshToken);

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Token refresh failed: 400");
      expect(error).toContain("invalid_grant");
    });

    it("ネットワークエラーが発生した場合はエラーを返す", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Connection timeout"));

      // Act
      const result = await refreshAccessToken(clientId, refreshToken);

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Failed to refresh access token");
      expect(error).toContain("Connection timeout");
    });
  });

  describe("createSpotifyClientWithRefresh", () => {
    const clientId = "test-client-id" as SpotifyClientId;
    const accessToken = tokenFixtures.validAccessToken as SpotifyAccessToken;
    const refreshToken = tokenFixtures.validRefreshToken as SpotifyRefreshToken;

    beforeEach(() => {
      vi.spyOn(Date, "now");
    });

    it("有効なトークンでクライアントを作成する", async () => {
      // Arrange
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1時間後
      vi.mocked(Date.now).mockReturnValue(Date.now());

      // Act
      const result = await createSpotifyClientWithRefresh(
        clientId,
        accessToken,
        refreshToken,
        expiresAt,
      );

      // Assert
      const client = expectResult(result).toBeOk();
      expect(client).toBeInstanceOf(SpotifyApi);
      expect(mockFetch).not.toHaveBeenCalled(); // リフレッシュは呼ばれない
    });

    it("期限切れトークンの場合は自動的にリフレッシュする", async () => {
      // Arrange
      const now = Date.now();
      const expiresAt = now - 1000; // 既に期限切れ
      vi.mocked(Date.now).mockReturnValue(now);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => tokenFixtures.spotifyTokenResponses.standard,
      });

      // Act
      const result = await createSpotifyClientWithRefresh(
        clientId,
        accessToken,
        refreshToken,
        expiresAt,
      );

      // Assert
      const client = expectResult(result).toBeOk();
      expect(client).toBeInstanceOf(SpotifyApi);
      expect(mockFetch).toHaveBeenCalledTimes(1); // リフレッシュが呼ばれた
    });

    it("5分以内に期限切れになる場合は自動的にリフレッシュする", async () => {
      // Arrange
      const now = Date.now();
      const expiresAt = now + 4 * 60 * 1000; // 4分後に期限切れ
      vi.mocked(Date.now).mockReturnValue(now);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => tokenFixtures.spotifyTokenResponses.standard,
      });

      // Act
      const result = await createSpotifyClientWithRefresh(
        clientId,
        accessToken,
        refreshToken,
        expiresAt,
      );

      // Assert
      const client = expectResult(result).toBeOk();
      expect(client).toBeInstanceOf(SpotifyApi);
      expect(mockFetch).toHaveBeenCalledTimes(1); // リフレッシュが呼ばれた
    });

    it("リフレッシュに失敗した場合はエラーを返す", async () => {
      // Arrange
      const now = Date.now();
      const expiresAt = now - 1000; // 既に期限切れ
      vi.mocked(Date.now).mockReturnValue(now);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      // Act
      const result = await createSpotifyClientWithRefresh(
        clientId,
        accessToken,
        refreshToken,
        expiresAt,
      );

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Token refresh failed");
    });

    it("SpotifyApiの作成に失敗した場合はエラーを返す", async () => {
      // Arrange
      const expiresAt = Date.now() + 60 * 60 * 1000;
      vi.mocked(Date.now).mockReturnValue(Date.now());

      // SpotifyApi.withAccessTokenをモックしてエラーをスロー
      vi.spyOn(SpotifyApi, "withAccessToken").mockImplementation(() => {
        throw new Error("Invalid token format");
      });

      // Act
      const result = await createSpotifyClientWithRefresh(
        clientId,
        accessToken,
        refreshToken,
        expiresAt,
      );

      // Assert
      const error = expectResult(result).toBeErr();
      expect(error).toContain("Failed to create Spotify client");
      expect(error).toContain("Invalid token format");
    });
  });
});
