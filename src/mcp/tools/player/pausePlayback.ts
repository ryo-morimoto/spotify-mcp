import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

async function pausePlayback(
  client: SpotifyApi,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK requires device_id but API allows undefined - using empty string as workaround
    await client.player.pausePlayback(deviceId || "");

    return ok({
      message: "Playback paused successfully",
    });
  } catch (error) {
    return err(
      `Failed to pause playback: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const pausePlaybackSchema = {
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type PausePlaybackInput = z.infer<z.ZodObject<typeof pausePlaybackSchema>>;

export const createPausePlaybackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof pausePlaybackSchema> => ({
  name: "pause_playback",
  title: "Pause Playback",
  description: "Pause playback on the user's account",
  inputSchema: pausePlaybackSchema,
  handler: async (input: PausePlaybackInput): Promise<CallToolResult> => {
    const result = await pausePlayback(spotifyClient, input.deviceId);

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
