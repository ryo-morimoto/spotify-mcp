import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import {
  // Search tools
  createSearchTracksTool,
  createSearchAlbumsTool,
  createSearchArtistsTool,
  createSearchPlaylistsTool,
  createSearchShowsTool,
  createSearchEpisodesTool,
  createSearchAudiobooksTool,
  // Track tools
  createGetTrackTool,
  createGetTrackAudioAnalysisTool,
  createGetSeveralTracksTool,
  // Album tools
  createGetAlbumTool,
  createGetSavedAlbumsTool,
  createSaveAlbumsTool,
  createRemoveSavedAlbumsTool,
  createCheckSavedAlbumsTool,
  createGetAlbumTracksTool,
  createGetSeveralAlbumsTool,
  // Artist tools
  createGetArtistTool,
  createGetSeveralArtistsTool,
  createGetRelatedArtistsTool,
  createGetArtistAlbumsTool,
  createGetArtistTopTracksTool,
  // Playlist tools
  createGetPlaylistTool,
  createGetPlaylistItemsTool,
  createCreatePlaylistTool,
  createChangePlaylistDetailsTool,
  createAddItemsToPlaylistTool,
  createUpdatePlaylistItemsTool,
  createRemovePlaylistItemsTool,
  createGetCurrentUserPlaylistsTool,
  createGetUserPlaylistsTool,
  createGetFeaturedPlaylistsTool,
  createGetCategoryPlaylistsTool,
  createGetPlaylistCoverImageTool,
  createAddPlaylistCoverImageTool,
  // User tools
  createGetSavedTracksTool,
  createSaveTracksTool,
  createRemoveSavedTracksTool,
  createCheckSavedTracksTool,
  // Player tools
  createGetPlaybackStateTool,
  createGetAvailableDevicesTool,
  createGetCurrentlyPlayingTrackTool,
  createStartResumePlaybackTool,
  createPausePlaybackTool,
  createSkipToNextTool,
  createSkipToPreviousTool,
  createSeekToPositionTool,
  createSetRepeatModeTool,
  createSetPlaybackVolumeTool,
  createTogglePlaybackShuffleTool,
  createTransferPlaybackTool,
  createGetRecentlyPlayedTracksTool,
  createGetUserQueueTool,
  createAddItemToPlaybackQueueTool,
} from "@mcp/tools/index.ts";

export function createMCPServer(spotifyClient: SpotifyApi): McpServer {
  const server = new McpServer({
    name: "spotify-mcp-server",
    version: "1.0.0",
  });

  // Search tools
  const searchTools = [
    createSearchTracksTool(spotifyClient),
    createSearchAlbumsTool(spotifyClient),
    createSearchArtistsTool(spotifyClient),
    createSearchPlaylistsTool(spotifyClient),
    createSearchShowsTool(spotifyClient),
    createSearchEpisodesTool(spotifyClient),
    createSearchAudiobooksTool(spotifyClient),
  ];

  // Track tools
  const trackTools = [
    createGetTrackTool(spotifyClient),
    createGetTrackAudioAnalysisTool(spotifyClient),
    createGetSeveralTracksTool(spotifyClient),
  ];

  // Album tools
  const albumTools = [
    createGetAlbumTool(spotifyClient),
    createGetSavedAlbumsTool(spotifyClient),
    createSaveAlbumsTool(spotifyClient),
    createRemoveSavedAlbumsTool(spotifyClient),
    createCheckSavedAlbumsTool(spotifyClient),
    createGetAlbumTracksTool(spotifyClient),
    createGetSeveralAlbumsTool(spotifyClient),
  ];

  // Artist tools
  const artistTools = [
    createGetArtistTool(spotifyClient),
    createGetSeveralArtistsTool(spotifyClient),
    createGetRelatedArtistsTool(spotifyClient),
    createGetArtistAlbumsTool(spotifyClient),
    createGetArtistTopTracksTool(spotifyClient),
  ];

  // Playlist tools
  const playlistTools = [
    createGetPlaylistTool(spotifyClient),
    createGetPlaylistItemsTool(spotifyClient),
    createCreatePlaylistTool(spotifyClient),
    createChangePlaylistDetailsTool(spotifyClient),
    createAddItemsToPlaylistTool(spotifyClient),
    createUpdatePlaylistItemsTool(spotifyClient),
    createRemovePlaylistItemsTool(spotifyClient),
    createGetCurrentUserPlaylistsTool(spotifyClient),
    createGetUserPlaylistsTool(spotifyClient),
    createGetFeaturedPlaylistsTool(spotifyClient),
    createGetCategoryPlaylistsTool(spotifyClient),
    createGetPlaylistCoverImageTool(spotifyClient),
    createAddPlaylistCoverImageTool(spotifyClient),
  ];

  // User tools
  const userTools = [
    createGetSavedTracksTool(spotifyClient),
    createSaveTracksTool(spotifyClient),
    createRemoveSavedTracksTool(spotifyClient),
    createCheckSavedTracksTool(spotifyClient),
  ];

  // Player tools
  const playerTools = [
    createGetPlaybackStateTool(spotifyClient),
    createGetAvailableDevicesTool(spotifyClient),
    createGetCurrentlyPlayingTrackTool(spotifyClient),
    createStartResumePlaybackTool(spotifyClient),
    createPausePlaybackTool(spotifyClient),
    createSkipToNextTool(spotifyClient),
    createSkipToPreviousTool(spotifyClient),
    createSeekToPositionTool(spotifyClient),
    createSetRepeatModeTool(spotifyClient),
    createSetPlaybackVolumeTool(spotifyClient),
    createTogglePlaybackShuffleTool(spotifyClient),
    createTransferPlaybackTool(spotifyClient),
    createGetRecentlyPlayedTracksTool(spotifyClient),
    createGetUserQueueTool(spotifyClient),
    createAddItemToPlaybackQueueTool(spotifyClient),
  ];

  // Register all tool groups
  for (const tool of [
    ...searchTools,
    ...trackTools,
    ...albumTools,
    ...artistTools,
    ...playlistTools,
    ...userTools,
    ...playerTools,
  ]) {
    registerTool(server, tool as ToolDefinition<z.ZodRawShape>);
  }

  return server;
}

function registerTool(server: McpServer, tool: ToolDefinition<z.ZodRawShape>): void {
  const cb = async (args: z.objectOutputType<z.ZodRawShape, z.ZodTypeAny>) => {
    const parsed = z.object(tool.inputSchema).parse(args);
    return tool.handler(parsed);
  };

  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    cb as Parameters<typeof server.registerTool>[2],
  );
}
