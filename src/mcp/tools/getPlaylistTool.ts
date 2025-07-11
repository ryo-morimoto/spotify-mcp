import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../types.ts";
import { z } from "zod";
import { getPlaylist } from "./getPlaylist.ts";

const getPlaylistSchema = {
  playlistId: z.string().describe("Spotify playlist ID"),
} as const;

type GetPlaylistInput = z.infer<z.ZodObject<typeof getPlaylistSchema>>;

export const createGetPlaylistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getPlaylistSchema> => ({
  name: "get-playlist",
  title: "Get Playlist",
  description: "Get a single playlist by ID from Spotify",
  inputSchema: getPlaylistSchema,
  handler: async (input: GetPlaylistInput): Promise<CallToolResult> => {
    const result = await getPlaylist(spotifyClient, input.playlistId);

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
