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

type GetCategoryPlaylistsResult = {
  playlists: PlaylistSummary[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
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
      total: response.playlists.total,
      limit: response.playlists.limit,
      offset: response.playlists.offset,
      has_more: response.playlists.next !== null,
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
