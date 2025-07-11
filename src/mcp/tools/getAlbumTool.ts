import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getAlbum } from "./getAlbum.ts";

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
