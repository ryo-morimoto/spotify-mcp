import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Artist } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

const getRelatedArtistsSchema = {
  id: z.string().describe("The Spotify ID of the artist"),
} as const;

type GetRelatedArtistsInput = z.infer<z.ZodObject<typeof getRelatedArtistsSchema>>;

async function getRelatedArtists(
  client: SpotifyApi,
  id: string,
): Promise<Result<Artist[], string>> {
  try {
    const response = await client.artists.relatedArtists(id);
    return ok(response.artists);
  } catch (error) {
    return err(
      `Failed to get related artists: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetRelatedArtistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getRelatedArtistsSchema> => ({
  name: "get_related_artists",
  title: "Get Artist's Related Artists",
  description:
    "Get Spotify catalog information about artists similar to a given artist. Similarity is based on analysis of the Spotify community's listening history.",
  inputSchema: getRelatedArtistsSchema,
  handler: async (input: GetRelatedArtistsInput): Promise<CallToolResult> => {
    const result = await getRelatedArtists(spotifyClient, input.id);

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
