import { SpotifyApi, type PlaybackState } from '@spotify/web-api-ts-sdk';
import { Result, ok, err } from 'neverthrow';
import type { NetworkError, AuthError, SpotifyError } from '../../result.ts';
import { mapSpotifyError } from './errorMapper.ts';

// Re-export type for backward compatibility
export type { PlaybackState as PlayerState } from '@spotify/web-api-ts-sdk';

export type PlaybackCommand = 'play' | 'pause' | 'next' | 'previous';

/**
 * Get current playback state
 * Returns null when no device is active (204 No Content)
 */
export async function getCurrentPlayback(
  client: SpotifyApi,
): Promise<Result<PlaybackState | null, NetworkError | AuthError | SpotifyError>> {
  try {
    const playbackState = await client.player.getPlaybackState();
    return ok(playbackState);
  } catch (error) {
    // Handle 204 No Content internally - it means no active playback
    const errorObj = error as unknown as { status?: number };
    if (errorObj.status === 204) {
      return ok(null);
    }
    return err(mapSpotifyError(error));
  }
}

/**
 * Control playback with basic commands
 * Handles SDK type casting quirks internally
 */
export async function controlPlayback(
  client: SpotifyApi,
  command: PlaybackCommand,
  deviceId?: string,
): Promise<Result<void, NetworkError | AuthError | SpotifyError>> {
  try {
    // SDK requires device_id as string, but Spotify API accepts empty string for current device
    // This is a known SDK limitation where the types don't match the actual API behavior
    const device = deviceId || '';

    switch (command) {
      case 'play':
        await client.player.startResumePlayback(device);
        break;
      case 'pause':
        await client.player.pausePlayback(device);
        break;
      case 'next':
        await client.player.skipToNext(device);
        break;
      case 'previous':
        await client.player.skipToPrevious(device);
        break;
      default:
        // This should never happen with TypeScript, but handle it gracefully
        const _exhaustive: never = command;
        throw new Error(`Unknown command: ${_exhaustive}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(mapSpotifyError(error));
  }
}
