import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function addItemToPlaybackQueue(
  client: SpotifyApi,
  uri: string,
  deviceId?: string,
): Promise<Result<{ message: string }, string>> {
  // Validate URI
  if (uri.trim() === "") {
    return err("URI must not be empty");
  }

  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  try {
    // SDK requires device_id but API allows undefined - using empty string as workaround
    await client.player.addItemToPlaybackQueue(uri, deviceId || "");

    return ok({
      message: "Item added to queue successfully",
    });
  } catch (error) {
    return err(
      `Failed to add item to queue: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const addItemToPlaybackQueueSchema = {
  uri: z.string().describe("The URI of the item to add to the queue (track or episode)"),
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
} as const;

type AddItemToPlaybackQueueInput = z.infer<z.ZodObject<typeof addItemToPlaybackQueueSchema>>;

export const createAddItemToPlaybackQueueTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof addItemToPlaybackQueueSchema> => ({
  name: "add_item_to_playback_queue",
  title: "Add Item to Playback Queue",
  description: "Add an item to the end of the user's current playback queue",
  inputSchema: addItemToPlaybackQueueSchema,
  handler: async (input: AddItemToPlaybackQueueInput): Promise<CallToolResult> => {
    const result = await addItemToPlaybackQueue(spotifyClient, input.uri, input.deviceId);

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
