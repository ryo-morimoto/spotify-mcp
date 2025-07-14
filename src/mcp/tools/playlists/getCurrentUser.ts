import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, PlaylistSummary, SpotifyPaginatedResult } from "../../../types.ts";
import { z } from "zod";

type GetCurrentUserPlaylistsResult = SpotifyPaginatedResult<PlaylistSummary>;

async function getCurrentUserPlaylists(
  client: SpotifyApi,
  limit: number = 20,
  offset: number = 0,
): Promise<Result<GetCurrentUserPlaylistsResult, string>> {
  // Validate parameters
  if (limit < 1 || limit > 50) {
    return err("Limit must be between 1 and 50");
  }

  if (offset < 0) {
    return err("Offset must be a non-negative number");
  }

  try {
    const response = await client.currentUser.playlists.playlists(limit as any, offset);

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
      `Failed to get current user playlists: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getCurrentUserPlaylistsSchema = {
  limit: z
    .number()
    .optional()
    .describe("Maximum number of playlists to return (1-50, default: 20)"),
  offset: z.number().optional().describe("The index of the first playlist to return (default: 0)"),
} as const;

type GetCurrentUserPlaylistsInput = z.infer<z.ZodObject<typeof getCurrentUserPlaylistsSchema>>;

export const createGetCurrentUserPlaylistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getCurrentUserPlaylistsSchema> => ({
  name: "get_current_user_playlists",
  title: "Get Current User's Playlists",
  description: "Get a list of the playlists owned or followed by the current Spotify user",
  inputSchema: getCurrentUserPlaylistsSchema,
  handler: async (input: GetCurrentUserPlaylistsInput): Promise<CallToolResult> => {
    const result = await getCurrentUserPlaylists(spotifyClient, input.limit, input.offset);

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
