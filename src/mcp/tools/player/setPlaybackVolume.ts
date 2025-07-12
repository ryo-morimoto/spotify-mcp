import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

// Export for testing
export async function setPlaybackVolume(
  client: SpotifyApi,
  volumePercent: number,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate volume range
  if (volumePercent < 0 || volumePercent > 100) {
    return err("Volume must be between 0 and 100");
  }

  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK matches the API - device_id is optional
    await client.player.setPlaybackVolume(volumePercent, deviceId);

    return ok({
      message: `Volume set to ${volumePercent}% successfully`,
    });
  } catch (error) {
    return err(
      `Failed to set playback volume: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const setPlaybackVolumeSchema = {
  volumePercent: z
    .number()
    .min(0)
    .max(100)
    .describe("The volume to set. Must be a value from 0 to 100 inclusive"),
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type SetPlaybackVolumeInput = z.infer<z.ZodObject<typeof setPlaybackVolumeSchema>>;

export const createSetPlaybackVolumeTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof setPlaybackVolumeSchema> => ({
  name: "set_playback_volume",
  title: "Set Playback Volume",
  description: "Set the volume for the user's current playback device",
  inputSchema: setPlaybackVolumeSchema,
  handler: async (input: SetPlaybackVolumeInput): Promise<CallToolResult> => {
    const result = await setPlaybackVolume(spotifyClient, input.volumePercent, input.deviceId);

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
