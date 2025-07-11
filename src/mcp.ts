import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./mcp/tools/searchTracks.ts";
import { createSearchAlbumsTool } from "./mcp/tools/searchAlbums.ts";
import { createSearchArtistsTool } from "./mcp/tools/searchArtists.ts";
import { createSearchPlaylistsTool } from "./mcp/tools/searchPlaylists.ts";
import { createSearchShowsTool } from "./mcp/tools/searchShows.ts";
import { createSearchEpisodesTool } from "./mcp/tools/searchEpisodes.ts";

export function createMCPServer(spotifyClient: SpotifyApi): McpServer {
  const server = new McpServer({
    name: "spotify-mcp-server",
    version: "1.0.0",
  });

  const searchTracksTool = createSearchTracksTool(spotifyClient);
  const searchAlbumsTool = createSearchAlbumsTool(spotifyClient);
  const searchArtistsTool = createSearchArtistsTool(spotifyClient);
  const searchPlaylistsTool = createSearchPlaylistsTool(spotifyClient);
  const searchShowsTool = createSearchShowsTool(spotifyClient);
  const searchEpisodesTool = createSearchEpisodesTool(spotifyClient);

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

  server.registerTool(
    searchPlaylistsTool.name,
    {
      title: searchPlaylistsTool.title,
      description: searchPlaylistsTool.description,
      inputSchema: searchPlaylistsTool.inputSchema,
    },
    searchPlaylistsTool.handler,
  );

  server.registerTool(
    searchShowsTool.name,
    {
      title: searchShowsTool.title,
      description: searchShowsTool.description,
      inputSchema: searchShowsTool.inputSchema,
    },
    searchShowsTool.handler,
  );

  server.registerTool(
    searchEpisodesTool.name,
    {
      title: searchEpisodesTool.title,
      description: searchEpisodesTool.description,
      inputSchema: searchEpisodesTool.inputSchema,
    },
    searchEpisodesTool.handler,
  );

  return server;
}
