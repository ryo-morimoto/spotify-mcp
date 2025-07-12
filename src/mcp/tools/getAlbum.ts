import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyAlbumResult, ToolDefinition } from "../../types.ts";
import { z } from "zod";

// Export for testing
export async function getAlbum(
  client: SpotifyApi,
  albumId: string,
  market?: string,
): Promise<Result<SpotifyAlbumResult, string>> {
  // Validate album ID
  if (!albumId.trim()) {
    return err("Album ID must not be empty");
  }

  // Validate market parameter if provided
  if (market !== undefined) {
    // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  try {
    const album = await client.albums.get(albumId, market as Market);
    return ok({
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
    });
  } catch (error) {
    return err(`Failed to get album: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const getAlbumSchema = {
  albumId: z.string().describe("Spotify album ID"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetAlbumInput = z.infer<z.ZodObject<typeof getAlbumSchema>>;

export const createGetAlbumTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getAlbumSchema> => ({
  name: "get-album",
  title: "Get Album",
  description: "Get a single album by ID from Spotify",
  inputSchema: getAlbumSchema,
  handler: async (input: GetAlbumInput): Promise<CallToolResult> => {
    const result = await getAlbum(spotifyClient, input.albumId, input.market);

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
