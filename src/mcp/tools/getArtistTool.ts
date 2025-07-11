import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getArtist } from "./getArtist.ts";

const getArtistSchema = {
  artistId: z.string().describe("Spotify artist ID"),
} as const;

type GetArtistInput = z.infer<z.ZodObject<typeof getArtistSchema>>;

export const createGetArtistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getArtistSchema> => ({
  name: "get-artist",
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
