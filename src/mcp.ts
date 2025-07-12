import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./mcp/tools/searchTracks.ts";
import { createSearchAlbumsTool } from "./mcp/tools/searchAlbums.ts";
import { createSearchArtistsTool } from "./mcp/tools/searchArtists.ts";
import { createSearchPlaylistsTool } from "./mcp/tools/searchPlaylists.ts";
import { createSearchShowsTool } from "./mcp/tools/searchShows.ts";
import { createSearchEpisodesTool } from "./mcp/tools/searchEpisodes.ts";
import { createSearchAudiobooksTool } from "./mcp/tools/searchAudiobooks.ts";
import { createGetTrackTool } from "./mcp/tools/getTrackTool.ts";
import { createGetAlbumTool } from "./mcp/tools/getAlbumTool.ts";
import { createGetArtistTool } from "./mcp/tools/getArtistTool.ts";
import { createGetPlaylistTool } from "./mcp/tools/getPlaylistTool.ts";
import { createGetAlbumTracksTool } from "./mcp/tools/getAlbumTracksTool.ts";
import { createGetArtistAlbumsTool } from "./mcp/tools/getArtistAlbumsTool.ts";

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
  const searchAudiobooksTool = createSearchAudiobooksTool(spotifyClient);
  const getTrackTool = createGetTrackTool(spotifyClient);
  const getAlbumTool = createGetAlbumTool(spotifyClient);
  const getArtistTool = createGetArtistTool(spotifyClient);
  const getPlaylistTool = createGetPlaylistTool(spotifyClient);
  const getAlbumTracksTool = createGetAlbumTracksTool(spotifyClient);
  const getArtistAlbumsTool = createGetArtistAlbumsTool(spotifyClient);

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

  server.registerTool(
    searchAudiobooksTool.name,
    {
      title: searchAudiobooksTool.title,
      description: searchAudiobooksTool.description,
      inputSchema: searchAudiobooksTool.inputSchema,
    },
    searchAudiobooksTool.handler,
  );

  server.registerTool(
    getTrackTool.name,
    {
      title: getTrackTool.title,
      description: getTrackTool.description,
      inputSchema: getTrackTool.inputSchema,
    },
    getTrackTool.handler,
  );

  server.registerTool(
    getAlbumTool.name,
    {
      title: getAlbumTool.title,
      description: getAlbumTool.description,
      inputSchema: getAlbumTool.inputSchema,
    },
    getAlbumTool.handler,
  );

  server.registerTool(
    getArtistTool.name,
    {
      title: getArtistTool.title,
      description: getArtistTool.description,
      inputSchema: getArtistTool.inputSchema,
    },
    getArtistTool.handler,
  );

  server.registerTool(
    getPlaylistTool.name,
    {
      title: getPlaylistTool.title,
      description: getPlaylistTool.description,
      inputSchema: getPlaylistTool.inputSchema,
    },
    getPlaylistTool.handler,
  );

  server.registerTool(
    getAlbumTracksTool.name,
    {
      title: getAlbumTracksTool.title,
      description: getAlbumTracksTool.description,
      inputSchema: getAlbumTracksTool.inputSchema,
    },
    getAlbumTracksTool.handler,
  );

  server.registerTool(
    getArtistAlbumsTool.name,
    {
      title: getArtistAlbumsTool.title,
      description: getArtistAlbumsTool.description,
      inputSchema: getArtistAlbumsTool.inputSchema,
    },
    getArtistAlbumsTool.handler,
  );

  return server;
}
