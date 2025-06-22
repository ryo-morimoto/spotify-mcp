import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';
import type { AppError } from '../../result.ts';
import type { TokenManager } from '../../types/index.ts';
import { createSpotifyClient, controlPlayback } from '../../external/spotify/index.ts';

// TODO: Add more player control features [MID]
// - [ ] Volume control with fade in/out
// - [ ] Seek to specific position
// - [ ] Transfer playback between devices
// - [ ] Add to queue functionality
// See: src/spotifyApi.ts - PlaybackCommand type extensions

// FIXME: Validate command input more strictly [MID]
// - [ ] Check device availability before sending commands
// - [ ] Validate device supports the requested command
// - [ ] Add device_id parameter support
// Impact: Prevents errors when device is offline or doesn't support command

export const playerControlSchema = z.object({
  command: z.enum(['play', 'pause', 'next', 'previous']).describe('Playback command to execute'),
});

export type PlayerControlArgs = z.infer<typeof playerControlSchema>;

export async function handlePlayerControl(
  args: PlayerControlArgs,
  tokenManager: TokenManager,
): Promise<Result<string, AppError>> {
  // Get access token
  const tokenResult = await tokenManager.refreshTokenIfNeeded();
  if (tokenResult.isErr()) {
    return err(tokenResult.error);
  }

  // Create Spotify client and execute command
  const client = createSpotifyClient(tokenResult.value);
  // Pass undefined for deviceId to use the currently active device
  const controlResult = await controlPlayback(client, args.command, undefined);
  if (controlResult.isErr()) {
    return err(controlResult.error);
  }

  return ok(`Playback command executed: ${args.command}`);
}
