import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getArtistTopTracks } from "./getArtistTopTracks.ts";

const getArtistTopTracksSchema = {
  artistId: z.string().describe("Spotify artist ID"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .describe("ISO 3166-1 alpha-2 country code (required, e.g., 'US', 'JP')"),
} as const;

type GetArtistTopTracksInput = z.infer<z.ZodObject<typeof getArtistTopTracksSchema>>;

export const createGetArtistTopTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getArtistTopTracksSchema> => ({
  name: "get-artist-top-tracks",
  title: "Get Artist's Top Tracks",
  description: "Get the top tracks of an artist on Spotify by country",
  inputSchema: getArtistTopTracksSchema,
  handler: async (input: GetArtistTopTracksInput): Promise<CallToolResult> => {
    const result = await getArtistTopTracks(spotifyClient, input.artistId, input.market);

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
