import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./mcp/tools/searchTracks.ts";
import { createSearchAlbumsTool } from "./mcp/tools/searchAlbums.ts";
import { createSearchArtistsTool } from "./mcp/tools/searchArtists.ts";

export function createMCPServer(spotifyClient: SpotifyApi): McpServer {
  const server = new McpServer({
    name: "spotify-mcp-server",
    version: "1.0.0",
  });

  const searchTracksTool = createSearchTracksTool(spotifyClient);
  const searchAlbumsTool = createSearchAlbumsTool(spotifyClient);
  const searchArtistsTool = createSearchArtistsTool(spotifyClient);

  server.registerTool(
    searchTracksTool.name,
    {
      title: searchTracksTool.title,
      description: searchTracksTool.description,
      inputSchema: searchTracksTool.inputSchema,
    },
    searchTracksTool.handler,
  );

  server.registerTool(
    searchAlbumsTool.name,
    {
      title: searchAlbumsTool.title,
      description: searchAlbumsTool.description,
      inputSchema: searchAlbumsTool.inputSchema,
    },
    searchAlbumsTool.handler,
  );

  server.registerTool(
    searchArtistsTool.name,
    {
      title: searchArtistsTool.title,
      description: searchArtistsTool.description,
      inputSchema: searchArtistsTool.inputSchema,
    },
    searchArtistsTool.handler,
  );

  return server;
}
