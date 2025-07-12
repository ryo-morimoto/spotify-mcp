import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./mcp/tools/search/tracks.ts";
import { createSearchAlbumsTool } from "./mcp/tools/search/albums.ts";
import { createSearchArtistsTool } from "./mcp/tools/search/artists.ts";
import { createSearchPlaylistsTool } from "./mcp/tools/search/playlists.ts";
import { createSearchShowsTool } from "./mcp/tools/search/shows.ts";
import { createSearchEpisodesTool } from "./mcp/tools/search/episodes.ts";
import { createSearchAudiobooksTool } from "./mcp/tools/search/audiobooks.ts";
import { createGetTrackTool } from "./mcp/tools/tracks/get.ts";
import { createGetTrackAudioFeaturesTool } from "./mcp/tools/tracks/getAudioFeatures.ts";
import { createGetSeveralTracksAudioFeaturesTool } from "./mcp/tools/tracks/getSeveralAudioFeatures.ts";
import { createGetTrackAudioAnalysisTool } from "./mcp/tools/tracks/getAudioAnalysis.ts";
import { createGetAlbumTool } from "./mcp/tools/albums/get.ts";
import { createGetSavedAlbumsTool } from "./mcp/tools/albums/getSaved.ts";
import { createSaveAlbumsTool } from "./mcp/tools/albums/save.ts";
import { createRemoveSavedAlbumsTool } from "./mcp/tools/albums/remove.ts";
import { createCheckSavedAlbumsTool } from "./mcp/tools/albums/check.ts";
import { createGetArtistTool } from "./mcp/tools/artists/get.ts";
import { createGetSeveralArtistsTool } from "./mcp/tools/artists/getSeveral.ts";
import { createGetRelatedArtistsTool } from "./mcp/tools/artists/getRelated.ts";
import { createGetPlaylistTool } from "./mcp/tools/playlists/get.ts";
import { createGetPlaylistItemsTool } from "./mcp/tools/playlists/getItems.ts";
import { createGetAlbumTracksTool } from "./mcp/tools/albums/getTracks.ts";
import { createGetArtistAlbumsTool } from "./mcp/tools/artists/getAlbums.ts";
import { createGetSeveralAlbumsTool } from "./mcp/tools/albums/getSeveral.ts";
import { createGetArtistTopTracksTool } from "./mcp/tools/artists/getTopTracks.ts";
import { createGetSeveralTracksTool } from "./mcp/tools/tracks/getSeveral.ts";
import { createGetSavedTracksTool } from "./mcp/tools/users/getSavedTracks.ts";
import { createSaveTracksTool } from "./mcp/tools/users/saveTracks.ts";
import { createRemoveSavedTracksTool } from "./mcp/tools/users/removeSavedTracks.ts";
import { createCheckSavedTracksTool } from "./mcp/tools/users/checkSavedTracks.ts";
import { createGetPlaybackStateTool } from "./mcp/tools/player/getPlaybackState.ts";
import { createGetAvailableDevicesTool } from "./mcp/tools/player/getAvailableDevices.ts";
import { createGetCurrentlyPlayingTrackTool } from "./mcp/tools/player/getCurrentlyPlayingTrack.ts";
import { createStartResumePlaybackTool } from "./mcp/tools/player/startResumePlayback.ts";
import { createPausePlaybackTool } from "./mcp/tools/player/pausePlayback.ts";
import { createSkipToNextTool } from "./mcp/tools/player/skipToNext.ts";
import { createSkipToPreviousTool } from "./mcp/tools/player/skipToPrevious.ts";
import { createSeekToPositionTool } from "./mcp/tools/player/seekToPosition.ts";
import { createSetRepeatModeTool } from "./mcp/tools/player/setRepeatMode.ts";
import { createSetPlaybackVolumeTool } from "./mcp/tools/player/setPlaybackVolume.ts";
import { createTogglePlaybackShuffleTool } from "./mcp/tools/player/togglePlaybackShuffle.ts";
import { createTransferPlaybackTool } from "./mcp/tools/player/transferPlayback.ts";
import { createGetRecentlyPlayedTracksTool } from "./mcp/tools/player/getRecentlyPlayedTracks.ts";
import { createGetUserQueueTool } from "./mcp/tools/player/getUserQueue.ts";
import { createAddItemToPlaybackQueueTool } from "./mcp/tools/player/addItemToPlaybackQueue.ts";

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
  const getTrackAudioFeaturesTool = createGetTrackAudioFeaturesTool(spotifyClient);
  const getSeveralTracksAudioFeaturesTool = createGetSeveralTracksAudioFeaturesTool(spotifyClient);
  const getTrackAudioAnalysisTool = createGetTrackAudioAnalysisTool(spotifyClient);
  const getAlbumTool = createGetAlbumTool(spotifyClient);
  const getSavedAlbumsTool = createGetSavedAlbumsTool(spotifyClient);
  const saveAlbumsTool = createSaveAlbumsTool(spotifyClient);
  const removeSavedAlbumsTool = createRemoveSavedAlbumsTool(spotifyClient);
  const checkSavedAlbumsTool = createCheckSavedAlbumsTool(spotifyClient);
  const getArtistTool = createGetArtistTool(spotifyClient);
  const getSeveralArtistsTool = createGetSeveralArtistsTool(spotifyClient);
  const getRelatedArtistsTool = createGetRelatedArtistsTool(spotifyClient);
  const getPlaylistTool = createGetPlaylistTool(spotifyClient);
  const getPlaylistItemsTool = createGetPlaylistItemsTool(spotifyClient);
  const getAlbumTracksTool = createGetAlbumTracksTool(spotifyClient);
  const getArtistAlbumsTool = createGetArtistAlbumsTool(spotifyClient);
  const getSeveralAlbumsTool = createGetSeveralAlbumsTool(spotifyClient);
  const getArtistTopTracksTool = createGetArtistTopTracksTool(spotifyClient);
  const getSeveralTracksTool = createGetSeveralTracksTool(spotifyClient);
  const getSavedTracksTool = createGetSavedTracksTool(spotifyClient);
  const saveTracksTool = createSaveTracksTool(spotifyClient);
  const removeSavedTracksTool = createRemoveSavedTracksTool(spotifyClient);
  const checkSavedTracksTool = createCheckSavedTracksTool(spotifyClient);
  const getPlaybackStateTool = createGetPlaybackStateTool(spotifyClient);
  const getAvailableDevicesTool = createGetAvailableDevicesTool(spotifyClient);
  const getCurrentlyPlayingTrackTool = createGetCurrentlyPlayingTrackTool(spotifyClient);
  const startResumePlaybackTool = createStartResumePlaybackTool(spotifyClient);
  const pausePlaybackTool = createPausePlaybackTool(spotifyClient);
  const skipToNextTool = createSkipToNextTool(spotifyClient);
  const skipToPreviousTool = createSkipToPreviousTool(spotifyClient);
  const seekToPositionTool = createSeekToPositionTool(spotifyClient);
  const setRepeatModeTool = createSetRepeatModeTool(spotifyClient);
  const setPlaybackVolumeTool = createSetPlaybackVolumeTool(spotifyClient);
  const togglePlaybackShuffleTool = createTogglePlaybackShuffleTool(spotifyClient);
  const transferPlaybackTool = createTransferPlaybackTool(spotifyClient);
  const getRecentlyPlayedTracksTool = createGetRecentlyPlayedTracksTool(spotifyClient);
  const getUserQueueTool = createGetUserQueueTool(spotifyClient);
  const addItemToPlaybackQueueTool = createAddItemToPlaybackQueueTool(spotifyClient);

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
    getTrackAudioFeaturesTool.name,
    {
      title: getTrackAudioFeaturesTool.title,
      description: getTrackAudioFeaturesTool.description,
      inputSchema: getTrackAudioFeaturesTool.inputSchema,
    },
    getTrackAudioFeaturesTool.handler,
  );

  server.registerTool(
    getSeveralTracksAudioFeaturesTool.name,
    {
      title: getSeveralTracksAudioFeaturesTool.title,
      description: getSeveralTracksAudioFeaturesTool.description,
      inputSchema: getSeveralTracksAudioFeaturesTool.inputSchema,
    },
    getSeveralTracksAudioFeaturesTool.handler,
  );

  server.registerTool(
    getTrackAudioAnalysisTool.name,
    {
      title: getTrackAudioAnalysisTool.title,
      description: getTrackAudioAnalysisTool.description,
      inputSchema: getTrackAudioAnalysisTool.inputSchema,
    },
    getTrackAudioAnalysisTool.handler,
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
    getSavedAlbumsTool.name,
    {
      title: getSavedAlbumsTool.title,
      description: getSavedAlbumsTool.description,
      inputSchema: getSavedAlbumsTool.inputSchema,
    },
    getSavedAlbumsTool.handler,
  );

  server.registerTool(
    saveAlbumsTool.name,
    {
      title: saveAlbumsTool.title,
      description: saveAlbumsTool.description,
      inputSchema: saveAlbumsTool.inputSchema,
    },
    saveAlbumsTool.handler,
  );

  server.registerTool(
    removeSavedAlbumsTool.name,
    {
      title: removeSavedAlbumsTool.title,
      description: removeSavedAlbumsTool.description,
      inputSchema: removeSavedAlbumsTool.inputSchema,
    },
    removeSavedAlbumsTool.handler,
  );

  server.registerTool(
    checkSavedAlbumsTool.name,
    {
      title: checkSavedAlbumsTool.title,
      description: checkSavedAlbumsTool.description,
      inputSchema: checkSavedAlbumsTool.inputSchema,
    },
    checkSavedAlbumsTool.handler,
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
    getSeveralArtistsTool.name,
    {
      title: getSeveralArtistsTool.title,
      description: getSeveralArtistsTool.description,
      inputSchema: getSeveralArtistsTool.inputSchema,
    },
    getSeveralArtistsTool.handler,
  );

  server.registerTool(
    getRelatedArtistsTool.name,
    {
      title: getRelatedArtistsTool.title,
      description: getRelatedArtistsTool.description,
      inputSchema: getRelatedArtistsTool.inputSchema,
    },
    getRelatedArtistsTool.handler,
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
    getPlaylistItemsTool.name,
    {
      title: getPlaylistItemsTool.title,
      description: getPlaylistItemsTool.description,
      inputSchema: getPlaylistItemsTool.inputSchema,
    },
    getPlaylistItemsTool.handler,
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

  server.registerTool(
    getSeveralAlbumsTool.name,
    {
      title: getSeveralAlbumsTool.title,
      description: getSeveralAlbumsTool.description,
      inputSchema: getSeveralAlbumsTool.inputSchema,
    },
    getSeveralAlbumsTool.handler,
  );

  server.registerTool(
    getArtistTopTracksTool.name,
    {
      title: getArtistTopTracksTool.title,
      description: getArtistTopTracksTool.description,
      inputSchema: getArtistTopTracksTool.inputSchema,
    },
    getArtistTopTracksTool.handler,
  );

  server.registerTool(
    getSeveralTracksTool.name,
    {
      title: getSeveralTracksTool.title,
      description: getSeveralTracksTool.description,
      inputSchema: getSeveralTracksTool.inputSchema,
    },
    getSeveralTracksTool.handler,
  );

  server.registerTool(
    getSavedTracksTool.name,
    {
      title: getSavedTracksTool.title,
      description: getSavedTracksTool.description,
      inputSchema: getSavedTracksTool.inputSchema,
    },
    getSavedTracksTool.handler,
  );

  server.registerTool(
    saveTracksTool.name,
    {
      title: saveTracksTool.title,
      description: saveTracksTool.description,
      inputSchema: saveTracksTool.inputSchema,
    },
    saveTracksTool.handler,
  );

  server.registerTool(
    removeSavedTracksTool.name,
    {
      title: removeSavedTracksTool.title,
      description: removeSavedTracksTool.description,
      inputSchema: removeSavedTracksTool.inputSchema,
    },
    removeSavedTracksTool.handler,
  );

  server.registerTool(
    checkSavedTracksTool.name,
    {
      title: checkSavedTracksTool.title,
      description: checkSavedTracksTool.description,
      inputSchema: checkSavedTracksTool.inputSchema,
    },
    checkSavedTracksTool.handler,
  );

  server.registerTool(
    getPlaybackStateTool.name,
    {
      title: getPlaybackStateTool.title,
      description: getPlaybackStateTool.description,
      inputSchema: getPlaybackStateTool.inputSchema,
    },
    getPlaybackStateTool.handler,
  );

  server.registerTool(
    getAvailableDevicesTool.name,
    {
      title: getAvailableDevicesTool.title,
      description: getAvailableDevicesTool.description,
      inputSchema: getAvailableDevicesTool.inputSchema,
    },
    getAvailableDevicesTool.handler,
  );

  server.registerTool(
    getCurrentlyPlayingTrackTool.name,
    {
      title: getCurrentlyPlayingTrackTool.title,
      description: getCurrentlyPlayingTrackTool.description,
      inputSchema: getCurrentlyPlayingTrackTool.inputSchema,
    },
    getCurrentlyPlayingTrackTool.handler,
  );

  server.registerTool(
    startResumePlaybackTool.name,
    {
      title: startResumePlaybackTool.title,
      description: startResumePlaybackTool.description,
      inputSchema: startResumePlaybackTool.inputSchema,
    },
    startResumePlaybackTool.handler,
  );

  server.registerTool(
    pausePlaybackTool.name,
    {
      title: pausePlaybackTool.title,
      description: pausePlaybackTool.description,
      inputSchema: pausePlaybackTool.inputSchema,
    },
    pausePlaybackTool.handler,
  );

  server.registerTool(
    skipToNextTool.name,
    {
      title: skipToNextTool.title,
      description: skipToNextTool.description,
      inputSchema: skipToNextTool.inputSchema,
    },
    skipToNextTool.handler,
  );

  server.registerTool(
    skipToPreviousTool.name,
    {
      title: skipToPreviousTool.title,
      description: skipToPreviousTool.description,
      inputSchema: skipToPreviousTool.inputSchema,
    },
    skipToPreviousTool.handler,
  );

  server.registerTool(
    seekToPositionTool.name,
    {
      title: seekToPositionTool.title,
      description: seekToPositionTool.description,
      inputSchema: seekToPositionTool.inputSchema,
    },
    seekToPositionTool.handler,
  );

  server.registerTool(
    setRepeatModeTool.name,
    {
      title: setRepeatModeTool.title,
      description: setRepeatModeTool.description,
      inputSchema: setRepeatModeTool.inputSchema,
    },
    setRepeatModeTool.handler,
  );

  server.registerTool(
    setPlaybackVolumeTool.name,
    {
      title: setPlaybackVolumeTool.title,
      description: setPlaybackVolumeTool.description,
      inputSchema: setPlaybackVolumeTool.inputSchema,
    },
    setPlaybackVolumeTool.handler,
  );

  server.registerTool(
    togglePlaybackShuffleTool.name,
    {
      title: togglePlaybackShuffleTool.title,
      description: togglePlaybackShuffleTool.description,
      inputSchema: togglePlaybackShuffleTool.inputSchema,
    },
    togglePlaybackShuffleTool.handler,
  );

  server.registerTool(
    transferPlaybackTool.name,
    {
      title: transferPlaybackTool.title,
      description: transferPlaybackTool.description,
      inputSchema: transferPlaybackTool.inputSchema,
    },
    transferPlaybackTool.handler,
  );

  server.registerTool(
    getRecentlyPlayedTracksTool.name,
    {
      title: getRecentlyPlayedTracksTool.title,
      description: getRecentlyPlayedTracksTool.description,
      inputSchema: getRecentlyPlayedTracksTool.inputSchema,
    },
    getRecentlyPlayedTracksTool.handler,
  );

  server.registerTool(
    getUserQueueTool.name,
    {
      title: getUserQueueTool.title,
      description: getUserQueueTool.description,
      inputSchema: getUserQueueTool.inputSchema,
    },
    getUserQueueTool.handler,
  );

  server.registerTool(
    addItemToPlaybackQueueTool.name,
    {
      title: addItemToPlaybackQueueTool.title,
      description: addItemToPlaybackQueueTool.description,
      inputSchema: addItemToPlaybackQueueTool.inputSchema,
    },
    addItemToPlaybackQueueTool.handler,
  );

  return server;
}
