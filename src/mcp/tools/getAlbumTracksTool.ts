import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getAlbumTracks } from "./getAlbumTracks.ts";

const getAlbumTracksSchema = {
  albumId: z.string().describe("Spotify album ID"),
} as const;

type GetAlbumTracksInput = z.infer<z.ZodObject<typeof getAlbumTracksSchema>>;

export const createGetAlbumTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getAlbumTracksSchema> => ({
  name: "get-album-tracks",
  title: "Get Album Tracks",
  description: "Get all tracks from a Spotify album",
  inputSchema: getAlbumTracksSchema,
  handler: async (input: GetAlbumTracksInput): Promise<CallToolResult> => {
    const result = await getAlbumTracks(spotifyClient, input.albumId);

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
