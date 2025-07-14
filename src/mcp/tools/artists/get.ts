import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyArtistResult, ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceUri, createResourceResponse } from "@mcp/tools/helpers/resourceHelpers.ts";

async function getArtist(
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

const getArtistSchema = {
  artistId: z.string().describe("Spotify artist ID"),
} as const;

type GetArtistInput = z.infer<z.ZodObject<typeof getArtistSchema>>;

export const createGetArtistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getArtistSchema> => ({
  name: "get_artist",
  title: "Get Artist",
  description: "Get a single artist by ID from Spotify",
  inputSchema: getArtistSchema,
  handler: async (input: GetArtistInput): Promise<CallToolResult> => {
    const result = await getArtist(spotifyClient, input.artistId);

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

    const uri = createResourceUri("artist", input.artistId);
    return createResourceResponse(uri, result.value);
  },
});
