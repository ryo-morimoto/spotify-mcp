import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Artist } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceUri, createResourceResponse } from "@mcp/tools/helpers/resourceHelpers.ts";

const getSeveralArtistsSchema = {
  ids: z.array(z.string()).min(1).max(50).describe("Array of Spotify artist IDs (maximum 50)"),
} as const;

type GetSeveralArtistsInput = z.infer<z.ZodObject<typeof getSeveralArtistsSchema>>;

async function getSeveralArtists(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<Artist[], string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one artist ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 artist IDs allowed");
  }

  try {
    const artists = await client.artists.get(ids);
    // Filter out null values (invalid IDs return null)
    const validArtists = artists.filter((artist): artist is Artist => artist !== null);
    return ok(validArtists);
  } catch (error) {
    return err(`Failed to get artists: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createGetSeveralArtistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralArtistsSchema> => ({
  name: "get_several_artists",
  title: "Get Several Artists",
  description: "Get Spotify catalog information for several artists based on their Spotify IDs",
  inputSchema: getSeveralArtistsSchema,
  handler: async (input: GetSeveralArtistsInput): Promise<CallToolResult> => {
    const result = await getSeveralArtists(spotifyClient, input.ids);

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

    const uri = createResourceUri("artists", "multiple");
    return createResourceResponse(uri, result.value);
  },
});
