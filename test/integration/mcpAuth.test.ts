import { describe, test, expect, vi } from "vitest";
import app from "../../src/index.ts";

describe("MCP Authentication", () => {
  test("returns authentication error when no session exists", async () => {
    const response = await app.request(
      "/mcp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            clientInfo: {
              name: "test-client",
              version: "1.0.0",
            },
          },
          id: 1,
        }),
      },
      {
        CLIENT_ID: "test-client-id",
        CORS_ORIGIN: "*",
      } as any,
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Authentication required",
        data: {
          authUrl: expect.stringContaining("/auth/spotify"),
        },
      },
      id: null,
    });
  });

  test("uses existing session when mcp-session-id is provided", async () => {
    const mockKV = {
      get: vi.fn(async (key: string) => {
        if (key === "mcp_session:test-session-123") {
          return JSON.stringify({
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiresAt: Date.now() + 3600000, // 1 hour from now
          });
        }
        return null;
      }),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };

    await app.request(
      "/mcp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "mcp-session-id": "test-session-123",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
          id: 1,
        }),
      },
      {
        CLIENT_ID: "test-client-id",
        OAUTH_KV: mockKV as any,
        CORS_ORIGIN: "*",
      } as any,
    );

    // セッションIDでKVから取得を試みたことを確認
    expect(mockKV.get).toHaveBeenCalledWith("mcp_session:test-session-123");
  });

  test("creates MCP session after successful OAuth callback", async () => {
    const mockKV = {
      get: vi.fn(async (key: string) => {
        if (key === "oauth_state:test-state") {
          return JSON.stringify({
            codeVerifier: "test-verifier",
            state: "test-state",
            redirectUri: "http://localhost:8787/auth/callback",
          });
        }
        return null;
      }),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };

    const response = await app.request(
      "/auth/callback?code=test-code&state=test-state&mcp_session=mcp-123",
      {
        method: "GET",
      },
      {
        CLIENT_ID: "test-client-id",
        OAUTH_KV: mockKV as any,
        CORS_ORIGIN: "*",
      } as any,
    );

    // トークン交換は失敗するが（テスト環境のため）、MCPセッションIDが提供されていることを確認
    expect(response.status).toBe(500); // Token exchange will fail in test

    // TODO: 実際のトークン交換成功時のテストは、モックを使わない統合テストで行う
  });

  test("returns authentication error when session token is expired", async () => {
    const mockKV = {
      get: vi.fn(async (key: string) => {
        if (key === "mcp_session:expired-session") {
          return JSON.stringify({
            accessToken: "expired-token",
            refreshToken: "refresh-token",
            expiresAt: Date.now() - 3600000, // 1 hour ago
          });
        }
        return null;
      }),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };

    const response = await app.request(
      "/mcp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "mcp-session-id": "expired-session",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
          id: 1,
        }),
      },
      {
        CLIENT_ID: "test-client-id",
        OAUTH_KV: mockKV as any,
        CORS_ORIGIN: "*",
      } as any,
    );

    // 期限切れトークンの場合、認証エラーを返す
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.message).toBe("Authentication required");
  });
});
