import { Result, ok, err } from 'neverthrow';
import type { AppError } from '../../result.ts';
import type { TokenManager } from '../../types/index.ts';
import {
  createSpotifyClient,
  getCurrentPlayback,
} from '../../external/spotify/index.ts';

// TODO: Enhance player state information [MID]
// - [ ] Add queue information
// - [ ] Include device capabilities
// - [ ] Show available actions based on current state
// Related: src/spotifyApi.ts - PlaybackState interface

export async function handlePlayerState(
  tokenManager: TokenManager
): Promise<Result<string, AppError>> {
  // Get access token
  const tokenResult = await tokenManager.refreshTokenIfNeeded();
  if (tokenResult.isErr()) {
    return err(tokenResult.error);
  }

  // Create Spotify client and get playback state
  const client = createSpotifyClient(tokenResult.value);
  const stateResult = await getCurrentPlayback(client);
  if (stateResult.isErr()) {
    return err(stateResult.error);
  }

  const state = stateResult.value;
  if (!state) {
    return ok('No active playback');
  }

  // Format playback info
  const track = state.item;
  const device = state.device;
  const status = state.is_playing ? 'Playing' : 'Paused';

  let info = `Now Playing: ${track?.name || 'Unknown'}\n`;
  if (track && 'artists' in track) {
    // Type guard to ensure this is a Track, not an Episode
    info += `Artist: ${track.artists.map((a: any) => a.name).join(', ')}\n`;
    if ('album' in track) {
      info += `Album: ${track.album.name}\n`;
    }
  }
  if (device) {
    info += `Device: ${device.name} (${device.type})\n`;
    info += `Volume: ${device.volume_percent}%\n`;
  }
  info += `Status: ${status}`;

  if (state.progress_ms !== undefined && track && 'duration_ms' in track) {
    const progress = Math.floor(state.progress_ms / 1000);
    const duration = Math.floor(track.duration_ms / 1000);
    info += `\nProgress: ${formatTime(progress)} / ${formatTime(duration)}`;
  }

  return ok(info);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}