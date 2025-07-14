import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, PlaylistSummary, PaginatedPlaylists } from "@types";
import { z } from "zod";

async function getUserPlaylists(
  client: SpotifyApi,
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Result<PaginatedPlaylists, string>> {
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
      id: playlist.id as any,
      name: playlist.name,
      description: playlist.description,
      owner: {
        id: playlist.owner.id,
        display_name: playlist.owner.display_name,
      },
      images: playlist.images || [],
      tracks: {
        total: playlist.tracks?.total || 0,
      },
      public: playlist.public,
      collaborative: playlist.collaborative,
      external_url: playlist.external_urls.spotify,
    }));

    return ok({
      href: response.href,
      items: playlists,
      limit: response.limit,
      next: response.next,
      offset: response.offset,
      previous: response.previous,
      total: response.total,
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
