import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyAlbumResult, ToolDefinition } from "../../../types.ts";
import { z } from "zod";

async function getSeveralAlbums(
  client: SpotifyApi,
  albumIds: string[],
  market?: string,
): Promise<Result<SpotifyAlbumResult[], string>> {
  // Validate album IDs array
  if (albumIds.length === 0) {
    return err("Album IDs must not be empty");
  }

  // Spotify API allows maximum 20 albums at once
  if (albumIds.length > 20) {
    return err("Maximum 20 album IDs allowed");
  }

  // Validate each album ID
  if (albumIds.some((id) => !id.trim())) {
    return err("All album IDs must be non-empty strings");
  }

  // Validate market parameter if provided
  if (market !== undefined) {
    // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  try {
    const albums = await client.albums.get(albumIds, market as Market);
    const results: SpotifyAlbumResult[] = albums.map((album) => ({
      id: album.id,
      name: album.name,
      artists: album.artists.map((artist) => artist.name).join(", "),
      release_date: album.release_date,
      total_tracks: album.total_tracks,
      album_type: album.album_type,
      external_url: album.external_urls.spotify,
      images: album.images.map((img) => ({
        url: img.url,
        height: img.height ?? null,
        width: img.width ?? null,
      })),
    }));
    return ok(results);
  } catch (error) {
    return err(`Failed to get albums: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const getSeveralAlbumsSchema = {
  albumIds: z.array(z.string()).min(1).max(20).describe("Array of Spotify album IDs (maximum 20)"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetSeveralAlbumsInput = z.infer<z.ZodObject<typeof getSeveralAlbumsSchema>>;

// Export for testing only
export { getSeveralAlbums };

export const createGetSeveralAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralAlbumsSchema> => ({
  name: "get_several_albums",
  title: "Get Several Albums",
  description: "Get multiple albums by their IDs from Spotify (maximum 20 albums)",
  inputSchema: getSeveralAlbumsSchema,
  handler: async (input: GetSeveralAlbumsInput): Promise<CallToolResult> => {
    const result = await getSeveralAlbums(spotifyClient, input.albumIds, input.market);

    if (result.isErr()) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${result.error}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.value, null, 2),
        },
      ],
    };
  },
});
