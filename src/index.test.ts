import { describe, test, expect, beforeEach, vi } from "vitest";
import app from "./index.ts";
import { createMockBindings, type MockBindings } from "../test/helpers/mockBindings.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

// Mock dependencies
vi.mock("./authHandler.ts", () => {
  const { Hono } = require("hono");
  const authApp = new Hono();
  authApp.all("*", () => new Response("Auth handler"));
  return { default: authApp };
});

vi.mock("./mcp.ts", () => ({
  createMCPServer: vi.fn(),
}));

vi.mock("./spotify.ts", () => ({
  createSpotifyClient: vi.fn(),
}));

vi.mock("@hono/mcp", () => ({
  StreamableHTTPTransport: vi.fn(),
}));

import { createMCPServer } from "./mcp.ts";
import { createSpotifyClient } from "./spotify.ts";
import { StreamableHTTPTransport } from "@hono/mcp";
import { ok, err } from "neverthrow";

describe("index", () => {
  let mockBindings: MockBindings;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBindings = createMockBindings();
  });

  describe("GET /.well-known/oauth-authorization-server", () => {
    test("OAuth discovery情報を返す", async () => {
      const req = new Request("http://localhost/.well-known/oauth-authorization-server");

      const res = await app.fetch(req, mockBindings);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        issuer: "http://localhost",
        authorization_endpoint: "http://localhost/auth/authorize",
        token_endpoint: "http://localhost/auth/token",
        registration_endpoint: "http://localhost/auth/register",
        scopes_supported: expect.any(Array),
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
      });
    });
  });

  describe("POST /mcp", () => {
    const validTokenData = {
      spotifyTokens: {
        accessToken: "spotify-access-token",
        refreshToken: "spotify-refresh-token",
        expiresAt: Date.now() + 3600000, // 1 hour from now
      },
      expiresAt: Date.now() + 3600000,
    };

    test("Authorizationヘッダーがない場合、401を返す", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    test("Bearer tokenでない場合、401を返す", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Authorization: "Basic some-token",
        },
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    test("無効なトークンの場合、401を返す", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Invalid token");
    });

    test("期限切れトークンの場合、401を返してトークンを削除する", async () => {
      const expiredTokenData = {
        ...validTokenData,
        expiresAt: Date.now() - 1000, // 1 second ago
      };

      const mockKV = mockBindings.OAUTH_KV;
      await mockKV.put("mcp_token:expired-token", JSON.stringify(expiredTokenData));

      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Authorization: "Bearer expired-token",
        },
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Token expired");

      // Verify token was deleted
      const deletedToken = await mockKV.get("mcp_token:expired-token");
      expect(deletedToken).toBeNull();
    });

    test("Spotifyクライアント作成に失敗した場合、500を返す", async () => {
      const mockKV = mockBindings.OAUTH_KV;
      await mockKV.put("mcp_token:valid-token", JSON.stringify(validTokenData));

      vi.mocked(createSpotifyClient).mockReturnValueOnce(err("Failed to create client"));

      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Failed to create Spotify client");
    });

    test("正常なリクエストの場合、MCPサーバーを作成してリクエストを処理する", async () => {
      const mockKV = mockBindings.OAUTH_KV;
      await mockKV.put("mcp_token:valid-token", JSON.stringify(validTokenData));

      const mockSpotifyClient = {} as SpotifyApi;
      vi.mocked(createSpotifyClient).mockReturnValueOnce(ok(mockSpotifyClient));

      const mockMcpServer = {
        connect: vi.fn(),
      } as any;
      vi.mocked(createMCPServer).mockReturnValueOnce(mockMcpServer);

      const mockTransport = {
        handleRequest: vi.fn().mockResolvedValueOnce(new Response("MCP response")),
      } as any;
      vi.mocked(StreamableHTTPTransport).mockImplementationOnce(() => mockTransport);

      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const res = await app.fetch(req, mockBindings);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("MCP response");

      // Verify correct flow
      expect(createSpotifyClient).toHaveBeenCalledWith({
        clientId: mockBindings.CLIENT_ID,
        redirectUri: mockBindings.SPOTIFY_REDIRECT_URI,
        accessToken: validTokenData.spotifyTokens.accessToken,
        refreshToken: validTokenData.spotifyTokens.refreshToken,
        expiresAt: validTokenData.spotifyTokens.expiresAt,
      });

      expect(createMCPServer).toHaveBeenCalledWith(mockSpotifyClient);
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockTransport);
      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });
  });

  describe("GET /health", () => {
    test("ヘルスチェックエンドポイントが正常に動作する", async () => {
      const req = new Request("http://localhost/health");

      const res = await app.fetch(req, mockBindings);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ status: "ok" });
    });
  });
});
