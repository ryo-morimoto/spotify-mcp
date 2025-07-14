import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, SnapshotResult } from "../../../types.ts";
import { z } from "zod";

async function updatePlaylistItems(
  client: SpotifyApi,
  playlistId: string,
  uris?: string[],
  rangeStart?: number,
  insertBefore?: number,
  rangeLength?: number,
  snapshotId?: string,
): Promise<Result<SnapshotResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  // Check if either URIs or range parameters are provided
  const hasUris = uris && uris.length > 0;
  const hasRangeParams = rangeStart !== undefined || insertBefore !== undefined;

  if (!hasUris && !hasRangeParams) {
    return err("Either uris or range parameters must be provided");
  }

  // Validate URIs if provided
  if (hasUris) {
    const uriPattern = /^spotify:(track|episode):[a-zA-Z0-9]+$/;
    for (const uri of uris) {
      if (!uriPattern.test(uri)) {
        if (uri.includes("spotify:album:")) {
          return err("Only track and episode URIs are supported");
        }
        return err(`Invalid URI format: ${uri}`);
      }
    }
  }

  // Validate range parameters
  if (hasRangeParams) {
    if (rangeStart === undefined || insertBefore === undefined) {
      return err("Both range_start and insert_before are required for reordering");
    }

    if (rangeStart < 0) {
      return err("range_start must be a non-negative number");
    }

    if (insertBefore < 0) {
      return err("insert_before must be a non-negative number");
    }

    if (rangeLength !== undefined && rangeLength <= 0) {
      return err("range_length must be a positive number");
    }
  }

  try {
    const response = await client.playlists.updatePlaylistItems(playlistId, {
      uris,
      range_start: rangeStart,
      insert_before: insertBefore,
      range_length: rangeLength,
      snapshot_id: snapshotId,
    });

    return ok({
      snapshot_id: response.snapshot_id,
    });
  } catch (error) {
    return err(
      `Failed to update playlist items: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const updatePlaylistItemsSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
  uris: z
    .array(z.string())
    .optional()
    .describe("An array of Spotify URIs to replace the playlist with"),
  range_start: z.number().optional().describe("The position of the first item to be reordered"),
  insert_before: z.number().optional().describe("The position where the items should be inserted"),
  range_length: z.number().optional().describe("The amount of items to be reordered (default: 1)"),
  snapshot_id: z
    .string()
    .optional()
    .describe("The playlist's snapshot ID against which you want to make the changes"),
} as const;

type UpdatePlaylistItemsInput = z.infer<z.ZodObject<typeof updatePlaylistItemsSchema>>;

export const createUpdatePlaylistItemsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof updatePlaylistItemsSchema> => ({
  name: "update_playlist_items",
  title: "Update Playlist Items",
  description: "Either reorder or replace items in a playlist",
  inputSchema: updatePlaylistItemsSchema,
  handler: async (input: UpdatePlaylistItemsInput): Promise<CallToolResult> => {
    const result = await updatePlaylistItems(
      spotifyClient,
      input.playlistId,
      input.uris,
      input.range_start,
      input.insert_before,
      input.range_length,
      input.snapshot_id,
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
