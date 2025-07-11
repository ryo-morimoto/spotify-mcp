import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { SpotifyArtistResult } from "../../types.ts";

export async function getArtist(
  client: SpotifyApi,
  artistId: string,
): Promise<Result<SpotifyArtistResult, string>> {
  // Validate artist ID
  if (!artistId.trim()) {
    return err("Artist ID must not be empty");
  }

  try {
    const artist = await client.artists.get(artistId);
    return ok({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      external_url: artist.external_urls.spotify,
      images: artist.images.map((image) => ({
        url: image.url,
        height: image.height,
        width: image.width,
      })),
    });
  } catch (error) {
    return err(`Failed to get artist: ${error instanceof Error ? error.message : String(error)}`);
  }
}
