import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

const checkSavedTracksSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify track IDs to check (maximum 50)"),
} as const;

type CheckSavedTracksInput = z.infer<z.ZodObject<typeof checkSavedTracksSchema>>;

async function checkSavedTracks(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<boolean[], string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one track ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 track IDs allowed");
  }

  try {
    const result = await client.currentUser.tracks.hasSavedTracks(ids);
    return ok(result);
  } catch (error) {
    return err(`Failed to check tracks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createCheckSavedTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof checkSavedTracksSchema> => ({
  name: "check_saved_tracks",
  title: "Check if Tracks are Saved",
  description: "Check if one or more tracks are already saved in the current user's library",
  inputSchema: checkSavedTracksSchema,
  handler: async (input: CheckSavedTracksInput): Promise<CallToolResult> => {
    const result = await checkSavedTracks(spotifyClient, input.ids);

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

    // Create a mapping of track IDs to their saved status
    const trackStatus = input.ids.map((id, index) => ({
      id,
      saved: result.value[index],
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(trackStatus, null, 2),
        },
      ],
    };
  },
});
