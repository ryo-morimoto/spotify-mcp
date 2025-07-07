import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./mcp/tools/searchTracks.ts";

export function createMCPServer(spotifyClient: SpotifyApi): McpServer {
  const server = new McpServer({
    name: "spotify-mcp-server",
    version: "1.0.0",
  });

  const searchTracksTool = createSearchTracksTool(spotifyClient);

  server.registerTool(
    searchTracksTool.name,
    {
      title: searchTracksTool.title,
      description: searchTracksTool.description,
      inputSchema: searchTracksTool.inputSchema,
    },
    searchTracksTool.handler,
  );

  return server;
}
