import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getSeveralAlbums } from "./getSeveralAlbums.ts";

const getSeveralAlbumsSchema = {
  albumIds: z.array(z.string()).min(1).max(20).describe("Array of Spotify album IDs (maximum 20)"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetSeveralAlbumsInput = z.infer<z.ZodObject<typeof getSeveralAlbumsSchema>>;

export const createGetSeveralAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralAlbumsSchema> => ({
  name: "get-several-albums",
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
