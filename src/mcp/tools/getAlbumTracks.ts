import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { SpotifyTrackResult } from "../../types.ts";

export async function getAlbumTracks(
  client: SpotifyApi,
  albumId: string,
): Promise<Result<SpotifyTrackResult[], string>> {
  // Validate album ID
  if (!albumId.trim()) {
    return err("Album ID must not be empty");
  }

  try {
    const tracks = await client.albums.tracks(albumId);
    return ok(
      tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => artist.name).join(", "),
        album: "Unknown Album", // Album name is not included in the tracks endpoint response
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
      })),
    );
  } catch (error) {
    return err(
      `Failed to get album tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
