import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function togglePlaybackShuffle(
  client: SpotifyApi,
  state: boolean,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK matches the API - device_id is optional
    await client.player.togglePlaybackShuffle(state, deviceId);

    return ok({
      message: `Shuffle ${state ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    return err(
      `Failed to toggle shuffle: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const togglePlaybackShuffleSchema = {
  state: z.boolean().describe("true to turn on shuffle, false to turn it off"),
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type TogglePlaybackShuffleInput = z.infer<z.ZodObject<typeof togglePlaybackShuffleSchema>>;

export const createTogglePlaybackShuffleTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof togglePlaybackShuffleSchema> => ({
  name: "toggle_playback_shuffle",
  title: "Toggle Playback Shuffle",
  description: "Toggle shuffle on or off for the user's playback",
  inputSchema: togglePlaybackShuffleSchema,
  handler: async (input: TogglePlaybackShuffleInput): Promise<CallToolResult> => {
    const result = await togglePlaybackShuffle(spotifyClient, input.state, input.deviceId);

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
