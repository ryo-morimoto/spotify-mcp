import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function transferPlayback(
  client: SpotifyApi,
  deviceIds: string[],
  play?: boolean,
): Promise<Result<{ message: string }, string>> {
  // Validate device IDs array
  if (deviceIds.length === 0) {
    return err("At least one device ID must be provided");
  }

  // Validate each device ID
  for (const deviceId of deviceIds) {
    if (deviceId.trim() === "") {
      return err("Device IDs must not be empty");
    }
  }

  try {
    // SDK matches the API - play parameter is optional
    await client.player.transferPlayback(deviceIds, play);

    return ok({
      message:
        play === true
          ? "Playback transferred and started successfully"
          : "Playback transferred successfully",
    });
  } catch (error) {
    return err(
      `Failed to transfer playback: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const transferPlaybackSchema = {
  deviceIds: z
    .array(z.string())
    .min(1)
    .describe(
      "An array containing the ID of the device on which playback should be started/transferred",
    ),
  play: z
    .boolean()
    .optional()
    .describe(
      "true: ensure playback happens on new device, false or undefined: keep the current playback state",
    ),
} as const;

type TransferPlaybackInput = z.infer<z.ZodObject<typeof transferPlaybackSchema>>;

export const createTransferPlaybackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof transferPlaybackSchema> => ({
  name: "transfer_playback",
  title: "Transfer Playback",
  description: "Transfer playback to a new device and determine if it should start playing",
  inputSchema: transferPlaybackSchema,
  handler: async (input: TransferPlaybackInput): Promise<CallToolResult> => {
    const result = await transferPlayback(spotifyClient, input.deviceIds, input.play);

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
