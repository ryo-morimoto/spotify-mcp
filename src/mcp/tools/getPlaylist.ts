import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { SpotifyPlaylistResult } from "../../types.ts";

export async function getPlaylist(
  client: SpotifyApi,
  playlistId: string,
): Promise<Result<SpotifyPlaylistResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  try {
    const playlist = await client.playlists.getPlaylist(playlistId);
    return ok({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      owner: playlist.owner.display_name || playlist.owner.id,
      public: playlist.public,
      collaborative: playlist.collaborative,
      total_tracks: playlist.tracks.total,
      external_url: playlist.external_urls.spotify,
      images: playlist.images.map((image) => ({
        url: image.url,
        height: image.height,
        width: image.width,
      })),
    });
  } catch (error) {
    return err(`Failed to get playlist: ${error instanceof Error ? error.message : String(error)}`);
  }
}
