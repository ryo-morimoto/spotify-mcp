import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getArtistAlbums } from "./getArtistAlbums.ts";

const getArtistAlbumsSchema = {
  artistId: z.string().describe("Spotify artist ID"),
} as const;

type GetArtistAlbumsInput = z.infer<z.ZodObject<typeof getArtistAlbumsSchema>>;

export const createGetArtistAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getArtistAlbumsSchema> => ({
  name: "get-artist-albums",
  title: "Get Artist Albums",
  description: "Get albums from an artist on Spotify",
  inputSchema: getArtistAlbumsSchema,
  handler: async (input: GetArtistAlbumsInput): Promise<CallToolResult> => {
    const result = await getArtistAlbums(spotifyClient, input.artistId);

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
