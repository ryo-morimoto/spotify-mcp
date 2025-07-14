import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

// Simplified type for tool output
type PlaylistItemResult = {
  track: {
    id: string;
    name: string;
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      id: string;
      name: string;
      release_date: string;
    };
    duration_ms: number;
    explicit: boolean;
    external_url: string;
  };
  added_at: string;
  added_by: string;
};

async function getPlaylistItems(
  client: SpotifyApi,
  playlistId: string,
  limit?: number,
  offset?: number,
  market?: string,
): Promise<Result<PlaylistItemResult[], string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  try {
    const options: Record<string, unknown> = {};
    if (limit !== undefined) options.limit = limit;
    if (offset !== undefined) options.offset = offset;
    if (market !== undefined) options.market = market;

    const response = await client.playlists.getPlaylistItems(
      playlistId,
      market as any,
      undefined,
      limit as any,
      offset,
    );

    const items: PlaylistItemResult[] = response.items
      .filter((item) => item.track && item.track.type === "track")
      .map((item) => ({
        track: {
          id: item.track!.id,
          name: item.track!.name,
          artists: item.track!.artists.map((artist) => ({
            id: artist.id,
            name: artist.name,
          })),
          album: {
            id: item.track!.album.id,
            name: item.track!.album.name,
            release_date: item.track!.album.release_date,
          },
          duration_ms: item.track!.duration_ms,
          explicit: item.track!.explicit,
          external_url: item.track!.external_urls.spotify,
        },
        added_at: item.added_at,
        added_by: item.added_by?.id || "spotify",
      }));

    return ok(items);
  } catch (error) {
    return err(
      `Failed to get playlist items: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getPlaylistItemsSchema = {
  playlistId: z.string().describe("Spotify playlist ID"),
  limit: z.number().optional().describe("Maximum number of items to return (default: 20, max: 50)"),
  offset: z.number().optional().describe("Index of the first item to return (default: 0)"),
  market: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
} as const;

type GetPlaylistItemsInput = z.infer<z.ZodObject<typeof getPlaylistItemsSchema>>;

export const createGetPlaylistItemsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getPlaylistItemsSchema> => ({
  name: "get_playlist_items",
  title: "Get Playlist Items",
  description: "Get items (tracks) from a playlist",
  inputSchema: getPlaylistItemsSchema,
  handler: async (input: GetPlaylistItemsInput): Promise<CallToolResult> => {
    const result = await getPlaylistItems(
      spotifyClient,
      input.playlistId,
      input.limit,
      input.offset,
      input.market,
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

    const uri = createResourceUri("playlist", input.playlistId, undefined, "tracks");
    return createResourceResponse(uri, result.value);
  },
});
