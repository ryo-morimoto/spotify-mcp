import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const saveTracksSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify track IDs to save (maximum 50)"),
} as const;

type SaveTracksInput = z.infer<z.ZodObject<typeof saveTracksSchema>>;

// Export for testing
export async function saveTracks(client: SpotifyApi, ids: string[]): Promise<Result<void, string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one track ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 track IDs allowed");
  }

  try {
    await client.currentUser.tracks.saveTracks(ids);
    return ok(undefined);
  } catch (error) {
    return err(`Failed to save tracks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createSaveTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof saveTracksSchema> => ({
  name: "save-tracks",
  title: "Save Tracks to Library",
  description: "Save one or more tracks to the current user's library",
  inputSchema: saveTracksSchema,
  handler: async (input: SaveTracksInput): Promise<CallToolResult> => {
    const result = await saveTracks(spotifyClient, input.ids);

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
          text: `Successfully saved ${input.ids.length} track(s) to library`,
        },
      ],
    };
  },
});
