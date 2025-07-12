import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

async function seekToPosition(
  client: SpotifyApi,
  positionMs: number,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate position
  if (positionMs < 0) {
    return err("Position must be non-negative");
  }

  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK matches the API - device_id is optional
    await client.player.seekToPosition(positionMs, deviceId);

    return ok({
      message: `Seeked to position ${positionMs}ms successfully`,
    });
  } catch (error) {
    return err(
      `Failed to seek to position: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const seekToPositionSchema = {
  positionMs: z.number().describe("The position in milliseconds to seek to"),
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type SeekToPositionInput = z.infer<z.ZodObject<typeof seekToPositionSchema>>;

export const createSeekToPositionTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof seekToPositionSchema> => ({
  name: "seek_to_position",
  title: "Seek To Position",
  description: "Seeks to the given position in the currently playing track",
  inputSchema: seekToPositionSchema,
  handler: async (input: SeekToPositionInput): Promise<CallToolResult> => {
    const result = await seekToPosition(spotifyClient, input.positionMs, input.deviceId);

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
