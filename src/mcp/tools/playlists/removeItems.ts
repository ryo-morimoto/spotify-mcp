import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, SnapshotWithCountResult } from "@types";
import { z } from "zod";

type TrackWithPositions = {
  uri: string;
  positions?: number[];
};

async function removePlaylistItems(
  client: SpotifyApi,
  playlistId: string,
  uris?: string[],
  tracks?: TrackWithPositions[],
  snapshotId?: string,
): Promise<Result<SnapshotWithCountResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  // Check that either uris or tracks is provided, but not both
  if (!uris && !tracks) {
    return err("Either uris or tracks must be provided");
  }

  if (uris && tracks) {
    return err("Cannot provide both uris and tracks parameters");
  }

  let tracksToRemove: { uri: string; positions?: number[] }[] = [];

  // Process URIs
  if (uris) {
    if (uris.length > 100) {
      return err("Cannot remove more than 100 items at once");
    }

    // Validate URI format
    const uriPattern = /^spotify:(track|episode):[a-zA-Z0-9]+$/;
    for (const uri of uris) {
      if (!uriPattern.test(uri)) {
        if (uri.includes("spotify:album:")) {
          return err("Only track and episode URIs are supported");
        }
        return err(`Invalid URI format: ${uri}`);
      }
    }

    tracksToRemove = uris.map((uri) => ({ uri }));
  }

  // Process tracks with positions
  if (tracks) {
    if (tracks.length > 100) {
      return err("Cannot remove more than 100 items at once");
    }

    // Validate tracks
    const uriPattern = /^spotify:(track|episode):[a-zA-Z0-9]+$/;
    for (const track of tracks) {
      if (!uriPattern.test(track.uri)) {
        if (track.uri.includes("spotify:album:")) {
          return err("Only track and episode URIs are supported");
        }
        return err(`Invalid URI format: ${track.uri}`);
      }

      // Validate positions if provided
      if (track.positions) {
        for (const position of track.positions) {
          if (position < 0) {
            return err("All positions must be non-negative");
          }
        }
      }
    }

    tracksToRemove = tracks;
  }

  try {
    // Note: The Spotify Web API TypeScript SDK currently does not return the snapshot_id
    // from removeItemsFromPlaylist method, even though the underlying API does.
    // This is a known issue tracked at:
    // - Issue: https://github.com/spotify/spotify-web-api-ts-sdk/issues/122
    // - PR (pending): https://github.com/spotify/spotify-web-api-ts-sdk/pull/123
    //
    // Until the PR is merged, the method returns undefined.
    await client.playlists.removeItemsFromPlaylist(playlistId, {
      tracks: tracksToRemove,
      snapshot_id: snapshotId,
    } as any);

    // Return a placeholder response since the actual snapshot_id is not available
    return ok({
      snapshot_id: "not-available-due-to-sdk-limitation",
      items_removed: tracksToRemove.length,
    });
  } catch (error) {
    return err(
      `Failed to remove items from playlist: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const removePlaylistItemsSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
  uris: z
    .array(z.string())
    .optional()
    .describe("An array of Spotify URIs to remove from the playlist"),
  tracks: z
    .array(
      z.object({
        uri: z.string().describe("Spotify URI of the track or episode to remove"),
        positions: z
          .array(z.number())
          .optional()
          .describe("Specific positions of the item to remove"),
      }),
    )
    .optional()
    .describe("An array of objects containing URIs and optional positions"),
  snapshot_id: z
    .string()
    .optional()
    .describe("The playlist's snapshot ID against which you want to make the changes"),
} as const;

type RemovePlaylistItemsInput = z.infer<z.ZodObject<typeof removePlaylistItemsSchema>>;

export const createRemovePlaylistItemsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof removePlaylistItemsSchema> => ({
  name: "remove_playlist_items",
  title: "Remove Playlist Items",
  description: "Remove one or more items from a user's playlist",
  inputSchema: removePlaylistItemsSchema,
  handler: async (input: RemovePlaylistItemsInput): Promise<CallToolResult> => {
    const result = await removePlaylistItems(
      spotifyClient,
      input.playlistId,
      input.uris,
      input.tracks,
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
