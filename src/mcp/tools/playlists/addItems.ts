import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, SnapshotWithCountResult } from "../../../types.ts";
import { z } from "zod";

async function addItemsToPlaylist(
  client: SpotifyApi,
  playlistId: string,
  uris: string[],
  position?: number,
): Promise<Result<SnapshotWithCountResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  // Validate URIs
  if (uris.length === 0) {
    return err("At least one URI must be provided");
  }

  if (uris.length > 100) {
    return err("Cannot add more than 100 items at once");
  }

  // Validate URI format and type
  const uriPattern = /^spotify:(track|episode):[a-zA-Z0-9]+$/;
  for (const uri of uris) {
    if (!uriPattern.test(uri)) {
      if (uri.includes("spotify:album:")) {
        return err("Only track and episode URIs are supported");
      }
      return err(`Invalid URI format: ${uri}`);
    }
  }

  // Validate position
  if (position !== undefined && position < 0) {
    return err("Position must be a non-negative number");
  }

  try {
    // Note: The Spotify Web API TypeScript SDK currently does not return the snapshot_id
    // from addItemsToPlaylist method, even though the underlying API does.
    // This is a known issue tracked at:
    // - Issue: https://github.com/spotify/spotify-web-api-ts-sdk/issues/122
    // - PR (pending): https://github.com/spotify/spotify-web-api-ts-sdk/pull/123
    //
    // Until the PR is merged, the method returns undefined.
    await client.playlists.addItemsToPlaylist(playlistId, uris, position);

    // Return a placeholder response since the actual snapshot_id is not available
    return ok({
      snapshot_id: "not-available-due-to-sdk-limitation",
      items_added: uris.length,
    });
  } catch (error) {
    return err(
      `Failed to add items to playlist: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const addItemsToPlaylistSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
  uris: z
    .array(z.string())
    .describe("An array of Spotify URIs (tracks or episodes) to add to the playlist"),
  position: z.number().optional().describe("The position to insert the items, a zero-based index"),
} as const;

type AddItemsToPlaylistInput = z.infer<z.ZodObject<typeof addItemsToPlaylistSchema>>;

export const createAddItemsToPlaylistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof addItemsToPlaylistSchema> => ({
  name: "add_items_to_playlist",
  title: "Add Items to Playlist",
  description: "Add one or more items (tracks or episodes) to a user's playlist",
  inputSchema: addItemsToPlaylistSchema,
  handler: async (input: AddItemsToPlaylistInput): Promise<CallToolResult> => {
    const result = await addItemsToPlaylist(
      spotifyClient,
      input.playlistId,
      input.uris,
      input.position,
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
