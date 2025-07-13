import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

type PlaylistSummary = {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  owner: string;
  total_tracks: number;
  external_url: string;
};

type GetUserPlaylistsResult = {
  playlists: PlaylistSummary[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

async function getUserPlaylists(
  client: SpotifyApi,
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Result<GetUserPlaylistsResult, string>> {
  // Validate user ID
  if (!userId.trim()) {
    return err("User ID must not be empty");
  }

  // Validate parameters
  if (limit < 1 || limit > 50) {
    return err("Limit must be between 1 and 50");
  }

  if (offset < 0) {
    return err("Offset must be a non-negative number");
  }

  try {
    const response = await client.playlists.getUsersPlaylists(userId, limit as any, offset);

    const playlists: PlaylistSummary[] = response.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      public: playlist.public,
      collaborative: playlist.collaborative,
      owner: playlist.owner.display_name || playlist.owner.id,
      total_tracks: playlist.tracks?.total || 0,
      external_url: playlist.external_urls.spotify,
    }));

    return ok({
      playlists,
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      has_more: response.next !== null,
    });
  } catch (error) {
    return err(
      `Failed to get user playlists: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getUserPlaylistsSchema = {
  userId: z.string().describe("The user's Spotify user ID"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of playlists to return (1-50, default: 20)"),
  offset: z.number().optional().describe("The index of the first playlist to return (default: 0)"),
} as const;

type GetUserPlaylistsInput = z.infer<z.ZodObject<typeof getUserPlaylistsSchema>>;

export const createGetUserPlaylistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getUserPlaylistsSchema> => ({
  name: "get_user_playlists",
  title: "Get User's Playlists",
  description: "Get a list of the playlists owned or followed by a Spotify user",
  inputSchema: getUserPlaylistsSchema,
  handler: async (input: GetUserPlaylistsInput): Promise<CallToolResult> => {
    const result = await getUserPlaylists(spotifyClient, input.userId, input.limit, input.offset);

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
