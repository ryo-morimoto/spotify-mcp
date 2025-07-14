import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, PlaylistSummary, SpotifyPaginatedResult } from "../../../types.ts";
import { z } from "zod";

type GetCategoryPlaylistsResult = {
  playlists: SpotifyPaginatedResult<PlaylistSummary>;
};

async function getCategoryPlaylists(
  client: SpotifyApi,
  categoryId: string,
  country?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Result<GetCategoryPlaylistsResult, string>> {
  // Validate category ID
  if (!categoryId.trim()) {
    return err("Category ID must not be empty");
  }

  // Validate parameters
  if (limit < 1 || limit > 50) {
    return err("Limit must be between 1 and 50");
  }

  if (offset < 0) {
    return err("Offset must be a non-negative number");
  }

  // Validate country code if provided
  if (country && country.length !== 2) {
    return err("Country must be a valid ISO 3166-1 alpha-2 country code");
  }

  try {
    const response = await client.browse.getPlaylistsForCategory(
      categoryId,
      country as any,
      limit as any,
      offset,
    );

    const playlists: PlaylistSummary[] = response.playlists.items.map((playlist) => ({
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
      playlists: {
        href: response.playlists.href,
        items: playlists,
        limit: response.playlists.limit,
        next: response.playlists.next,
        offset: response.playlists.offset,
        previous: response.playlists.previous,
        total: response.playlists.total,
      },
    });
  } catch (error) {
    return err(
      `Failed to get category playlists: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getCategoryPlaylistsSchema = {
  categoryId: z.string().describe("The Spotify category ID (e.g., 'rock', 'pop', 'jazz')"),
  country: z.string().optional().describe("A country: an ISO 3166-1 alpha-2 country code"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of playlists to return (1-50, default: 20)"),
  offset: z.number().optional().describe("The index of the first playlist to return (default: 0)"),
} as const;

type GetCategoryPlaylistsInput = z.infer<z.ZodObject<typeof getCategoryPlaylistsSchema>>;

export const createGetCategoryPlaylistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getCategoryPlaylistsSchema> => ({
  name: "get_category_playlists",
  title: "Get Category's Playlists",
  description: "Get a list of Spotify playlists tagged with a particular category",
  inputSchema: getCategoryPlaylistsSchema,
  handler: async (input: GetCategoryPlaylistsInput): Promise<CallToolResult> => {
    const result = await getCategoryPlaylists(
      spotifyClient,
      input.categoryId,
      input.country,
      input.limit,
      input.offset,
    );

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
