/**
 * Spotify External API Module
 *
 * Public interface for Spotify Web API integration.
 * All functions return Result types for explicit error handling.
 */

// Client factory
export { createSpotifyClient } from './client.ts';

// Search functionality
export { searchTracks } from './search.ts';

// Player functionality
export {
  getCurrentPlayback,
  controlPlayback,
  type PlayerState,
  type PlaybackCommand,
} from './player.ts';

// Re-export types from SDK that consumers need
export type {
  Track as SpotifyTrack,
  Artist as SpotifyArtist,
  Album as SpotifyAlbum,
  Device as SpotifyDevice,
  PlaybackState,
} from '@spotify/web-api-ts-sdk';
