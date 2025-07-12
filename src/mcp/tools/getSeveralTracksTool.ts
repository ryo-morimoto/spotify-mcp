import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getSeveralTracks } from "./getSeveralTracks.ts";

const getSeveralTracksSchema = {
  trackIds: z.array(z.string()).min(1).max(50).describe("Array of Spotify track IDs (maximum 50)"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetSeveralTracksInput = z.infer<z.ZodObject<typeof getSeveralTracksSchema>>;

export const createGetSeveralTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralTracksSchema> => ({
  name: "get-several-tracks",
  title: "Get Several Tracks",
  description: "Get multiple tracks by their IDs from Spotify (maximum 50 tracks)",
  inputSchema: getSeveralTracksSchema,
  handler: async (input: GetSeveralTracksInput): Promise<CallToolResult> => {
    const result = await getSeveralTracks(spotifyClient, input.trackIds, input.market);

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
