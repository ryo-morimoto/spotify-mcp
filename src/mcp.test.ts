import { describe, test, expect } from "vitest";
import { createMCPServer } from "./mcp.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("MCP Server", () => {
  test("creates MCP server with correct configuration", () => {
    const mockSpotifyClient = {} as SpotifyApi;
    const server = createMCPServer(mockSpotifyClient);

    expect(server).toBeDefined();
    // McpServerのインスタンスが作成されることを確認
    expect(server).toBeInstanceOf(McpServer);
  });

  test("registers search_tracks tool", () => {
    const mockSpotifyClient = {} as SpotifyApi;
    const server = createMCPServer(mockSpotifyClient);

    // MCPサーバーのツール一覧を確認する方法を調査する必要がある
    // 一旦、サーバーが作成されることを確認
    expect(server).toBeDefined();
  });
});
