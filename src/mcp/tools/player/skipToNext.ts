import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

// Export for testing
export async function skipToNext(
  client: SpotifyApi,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK requires device_id but API allows undefined - using empty string as workaround
    await client.player.skipToNext(deviceId || "");

    return ok({
      message: "Skipped to next track successfully",
    });
  } catch (error) {
    return err(
      `Failed to skip to next track: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const skipToNextSchema = {
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type SkipToNextInput = z.infer<z.ZodObject<typeof skipToNextSchema>>;

export const createSkipToNextTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof skipToNextSchema> => ({
  name: "skip_to_next",
  title: "Skip To Next",
  description: "Skips to next track in the user's queue",
  inputSchema: skipToNextSchema,
  handler: async (input: SkipToNextInput): Promise<CallToolResult> => {
    const result = await skipToNext(spotifyClient, input.deviceId);

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
