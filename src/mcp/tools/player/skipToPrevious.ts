import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function skipToPrevious(
  client: SpotifyApi,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK requires device_id but API allows undefined - using empty string as workaround
    await client.player.skipToPrevious(deviceId || "");

    return ok({
      message: "Skipped to previous track successfully",
    });
  } catch (error) {
    return err(
      `Failed to skip to previous track: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const skipToPreviousSchema = {
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type SkipToPreviousInput = z.infer<z.ZodObject<typeof skipToPreviousSchema>>;

export const createSkipToPreviousTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof skipToPreviousSchema> => ({
  name: "skip_to_previous",
  title: "Skip To Previous",
  description: "Skips to previous track in the user's queue",
  inputSchema: skipToPreviousSchema,
  handler: async (input: SkipToPreviousInput): Promise<CallToolResult> => {
    const result = await skipToPrevious(spotifyClient, input.deviceId);

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
