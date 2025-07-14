// Re-export all MCP tool creation functions

// Search tools
export { createSearchTracksTool } from "./search/tracks.ts";
export { createSearchAlbumsTool } from "./search/albums.ts";
export { createSearchArtistsTool } from "./search/artists.ts";
export { createSearchPlaylistsTool } from "./search/playlists.ts";
export { createSearchShowsTool } from "./search/shows.ts";
export { createSearchEpisodesTool } from "./search/episodes.ts";
export { createSearchAudiobooksTool } from "./search/audiobooks.ts";

// Track tools
export { createGetTrackTool } from "./tracks/get.ts";
export { createGetSeveralTracksTool } from "./tracks/getSeveral.ts";
export { createGetTrackAudioAnalysisTool } from "./tracks/getAudioAnalysis.ts";

// Album tools
export { createGetAlbumTool } from "./albums/get.ts";
export { createGetSeveralAlbumsTool } from "./albums/getSeveral.ts";
export { createGetAlbumTracksTool } from "./albums/getTracks.ts";
export { createGetSavedAlbumsTool } from "./albums/getSaved.ts";
export { createSaveAlbumsTool } from "./albums/save.ts";
export { createRemoveSavedAlbumsTool } from "./albums/remove.ts";
export { createCheckSavedAlbumsTool } from "./albums/check.ts";

// Artist tools
export { createGetArtistTool } from "./artists/get.ts";
export { createGetSeveralArtistsTool } from "./artists/getSeveral.ts";
export { createGetArtistAlbumsTool } from "./artists/getAlbums.ts";
export { createGetArtistTopTracksTool } from "./artists/getTopTracks.ts";
export { createGetRelatedArtistsTool } from "./artists/getRelated.ts";

// Playlist tools
export { createGetPlaylistTool } from "./playlists/get.ts";
export { createGetPlaylistItemsTool } from "./playlists/getItems.ts";
export { createCreatePlaylistTool } from "./playlists/create.ts";
export { createChangePlaylistDetailsTool } from "./playlists/changeDetails.ts";
export { createAddItemsToPlaylistTool } from "./playlists/addItems.ts";
export { createUpdatePlaylistItemsTool } from "./playlists/updateItems.ts";
export { createRemovePlaylistItemsTool } from "./playlists/removeItems.ts";
export { createGetCurrentUserPlaylistsTool } from "./playlists/getCurrentUser.ts";
export { createGetUserPlaylistsTool } from "./playlists/getUser.ts";
export { createGetFeaturedPlaylistsTool } from "./playlists/getFeatured.ts";
export { createGetCategoryPlaylistsTool } from "./playlists/getCategory.ts";
export { createGetPlaylistCoverImageTool } from "./playlists/getCoverImage.ts";
export { createAddPlaylistCoverImageTool } from "./playlists/addCoverImage.ts";

// User tools
export { createGetSavedTracksTool } from "./users/getSavedTracks.ts";
export { createSaveTracksTool } from "./users/saveTracks.ts";
export { createRemoveSavedTracksTool } from "./users/removeSavedTracks.ts";
export { createCheckSavedTracksTool } from "./users/checkSavedTracks.ts";

// Player tools
export { createGetPlaybackStateTool } from "./player/getPlaybackState.ts";
export { createGetAvailableDevicesTool } from "./player/getAvailableDevices.ts";
export { createGetCurrentlyPlayingTrackTool } from "./player/getCurrentlyPlayingTrack.ts";
export { createStartResumePlaybackTool } from "./player/startResumePlayback.ts";
export { createPausePlaybackTool } from "./player/pausePlayback.ts";
export { createSkipToNextTool } from "./player/skipToNext.ts";
export { createSkipToPreviousTool } from "./player/skipToPrevious.ts";
export { createSeekToPositionTool } from "./player/seekToPosition.ts";
export { createSetRepeatModeTool } from "./player/setRepeatMode.ts";
export { createSetPlaybackVolumeTool } from "./player/setPlaybackVolume.ts";
export { createTogglePlaybackShuffleTool } from "./player/togglePlaybackShuffle.ts";
export { createTransferPlaybackTool } from "./player/transferPlayback.ts";
export { createGetRecentlyPlayedTracksTool } from "./player/getRecentlyPlayedTracks.ts";
export { createGetUserQueueTool } from "./player/getUserQueue.ts";
export { createAddItemToPlaybackQueueTool } from "./player/addItemToPlaybackQueue.ts";
