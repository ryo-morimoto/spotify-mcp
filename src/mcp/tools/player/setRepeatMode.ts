import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

type RepeatState = "track" | "context" | "off";

async function setRepeatMode(
  client: SpotifyApi,
  state: RepeatState,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK matches the API - device_id is optional
    await client.player.setRepeatMode(state, deviceId);

    return ok({
      message: `Repeat mode set to '${state}' successfully`,
    });
  } catch (error) {
    return err(
      `Failed to set repeat mode: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const setRepeatModeSchema = {
  state: z
    .enum(["track", "context", "off"])
    .describe(
      "The repeat mode. track: repeat current track, context: repeat current context, off: turn off repeat",
    ),
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type SetRepeatModeInput = z.infer<z.ZodObject<typeof setRepeatModeSchema>>;

export const createSetRepeatModeTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof setRepeatModeSchema> => ({
  name: "set_repeat_mode",
  title: "Set Repeat Mode",
  description:
    "Set the repeat mode for the user's playback. Options are: repeat the current track, repeat the current context, or turn off repeat",
  inputSchema: setRepeatModeSchema,
  handler: async (input: SetRepeatModeInput): Promise<CallToolResult> => {
    const result = await setRepeatMode(spotifyClient, input.state, input.deviceId);

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
