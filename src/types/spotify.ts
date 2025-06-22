/**
 * Spotify-specific type definitions
 *
 * Re-exports and custom types for Spotify Web API
 */

import type { Track, PlaybackState } from '@spotify/web-api-ts-sdk';

// Re-export the Track type from SDK as SpotifyTrack for consistency
export type SpotifyTrack = Track;

// Re-export PlaybackState as PlayerState for consistency
export type PlayerState = PlaybackState;

// Custom playback command type
export type PlaybackCommand = 'play' | 'pause' | 'next' | 'previous';
