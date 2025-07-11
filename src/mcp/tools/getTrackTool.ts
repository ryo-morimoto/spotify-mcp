import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getTrack } from "./getTrack.ts";

const getTrackSchema = {
  trackId: z.string().describe("Spotify track ID"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetTrackInput = z.infer<z.ZodObject<typeof getTrackSchema>>;

export const createGetTrackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getTrackSchema> => ({
  name: "get-track",
  title: "Get Track",
  description: "Get a single track by ID from Spotify",
  inputSchema: getTrackSchema,
  handler: async (input: GetTrackInput): Promise<CallToolResult> => {
    const result = await getTrack(spotifyClient, input.trackId, input.market);

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
