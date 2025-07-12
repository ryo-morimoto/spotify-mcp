import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const removeSavedTracksSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify track IDs to remove (maximum 50)"),
} as const;

type RemoveSavedTracksInput = z.infer<z.ZodObject<typeof removeSavedTracksSchema>>;

// Export for testing
export async function removeSavedTracks(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<void, string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one track ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 track IDs allowed");
  }

  try {
    await client.currentUser.tracks.removeSavedTracks(ids);
    return ok(undefined);
  } catch (error) {
    return err(
      `Failed to remove tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createRemoveSavedTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof removeSavedTracksSchema> => ({
  name: "remove-saved-tracks",
  title: "Remove Tracks from Library",
  description: "Remove one or more tracks from the current user's library",
  inputSchema: removeSavedTracksSchema,
  handler: async (input: RemoveSavedTracksInput): Promise<CallToolResult> => {
    const result = await removeSavedTracks(spotifyClient, input.ids);

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
          text: `Successfully removed ${input.ids.length} track(s) from library`,
        },
      ],
    };
  },
});
