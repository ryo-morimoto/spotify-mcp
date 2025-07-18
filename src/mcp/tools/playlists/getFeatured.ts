import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, PlaylistSummary, PaginatedPlaylists } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

type GetFeaturedPlaylistsResult = {
  message?: string;
  playlists: PaginatedPlaylists;
};

async function getFeaturedPlaylists(
  client: SpotifyApi,
  country?: string,
  locale?: string,
  _timestamp?: string, // Not supported by SDK
  limit: number = 20,
  offset: number = 0,
): Promise<Result<GetFeaturedPlaylistsResult, string>> {
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
    // Note: The SDK doesn't support the timestamp parameter
    const response = await client.browse.getFeaturedPlaylists(
      country as any,
      locale,
      undefined, // timestamp parameter not supported by SDK
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
      message: response.message || undefined,
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
      `Failed to get featured playlists: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getFeaturedPlaylistsSchema = {
  country: z.string().optional().describe("A country: an ISO 3166-1 alpha-2 country code"),
  locale: z
    .string()
    .optional()
    .describe(
      "The desired language, consisting of a lowercase ISO 639-1 language code and an uppercase ISO 3166-1 alpha-2 country code",
    ),
  timestamp: z.string().optional().describe("A timestamp in ISO 8601 format: yyyy-MM-ddTHH:mm:ss"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of playlists to return (1-50, default: 20)"),
  offset: z.number().optional().describe("The index of the first playlist to return (default: 0)"),
} as const;

type GetFeaturedPlaylistsInput = z.infer<z.ZodObject<typeof getFeaturedPlaylistsSchema>>;

export const createGetFeaturedPlaylistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getFeaturedPlaylistsSchema> => ({
  name: "get_featured_playlists",
  title: "Get Featured Playlists",
  description: "Get a list of Spotify featured playlists",
  inputSchema: getFeaturedPlaylistsSchema,
  handler: async (input: GetFeaturedPlaylistsInput): Promise<CallToolResult> => {
    const result = await getFeaturedPlaylists(
      spotifyClient,
      input.country,
      input.locale,
      input.timestamp,
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

    const uri = createResourceUri("featured-playlists");
    return createResourceResponse(uri, result.value);
  },
});
