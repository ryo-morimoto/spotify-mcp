import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

type RemoveSavedTracksResult = {
  success: true;
  removed: number;
};

export async function removeSavedTracks(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<RemoveSavedTracksResult, string>> {
  // Handle empty array
  if (ids.length === 0) {
    return ok({
      success: true,
      removed: 0,
    });
  }

  // Validate maximum tracks
  if (ids.length > 50) {
    return err("Cannot remove more than 50 tracks at once");
  }

  try {
    await client.currentUser.tracks.removeSavedTracks(ids);
    return ok({
      success: true,
      removed: ids.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      return err(`Failed to remove tracks: ${error.message}`);
    }
    return err(`Failed to remove tracks: ${String(error)}`);
  }
}
