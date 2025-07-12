import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { SpotifyAlbumResult } from "../../types.ts";

export async function getArtistAlbums(
  client: SpotifyApi,
  artistId: string,
): Promise<Result<SpotifyAlbumResult[], string>> {
  // Validate artist ID
  if (!artistId.trim()) {
    return err("Artist ID must not be empty");
  }

  try {
    const response = await client.artists.albums(artistId);
    const albums: SpotifyAlbumResult[] = response.items.map((album) => ({
      id: album.id,
      name: album.name,
      artists: album.artists.map((artist) => artist.name).join(", "),
      release_date: album.release_date,
      total_tracks: album.total_tracks,
      album_type: album.album_type,
      external_url: album.external_urls.spotify,
      images: album.images.map((image) => ({
        url: image.url,
        height: image.height,
        width: image.width,
      })),
    }));

    return ok(albums);
  } catch (error) {
    return err(
      `Failed to get artist albums: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
