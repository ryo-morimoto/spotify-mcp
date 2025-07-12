import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

// Export for testing
export async function startResumePlayback(
  client: SpotifyApi,
  deviceId?: string,
  contextUri?: string,
  uris?: string[],
  offset?: { position?: number; uri?: string },
  positionMs?: number,
): Promise<Result<{ message: string }, string>> {
  // Validate device ID format if provided
  if (deviceId !== undefined && deviceId.trim() === "") {
    return err("Device ID must not be empty if provided");
  }

  // Validate context URI format if provided
  if (contextUri !== undefined) {
    if (
      !contextUri.match(/^spotify:(album|artist|playlist|show|episode|collection):[a-zA-Z0-9]+$/)
    ) {
      return err("Invalid context URI format");
    }
  }

  // Validate URIs format if provided
  if (uris !== undefined) {
    if (uris.length === 0) {
      return err("URIs array must not be empty if provided");
    }
    for (const uri of uris) {
      if (!uri.match(/^spotify:(track|episode):[a-zA-Z0-9]+$/)) {
        return err(`Invalid URI format: ${uri}`);
      }
    }
  }

  // Validate that context_uri and uris are not both provided
  if (contextUri !== undefined && uris !== undefined) {
    return err("Cannot provide both context_uri and uris");
  }

  // Validate offset
  if (offset !== undefined) {
    if (offset.position !== undefined && offset.uri !== undefined) {
      return err("Offset can only have either position or uri, not both");
    }
    if (offset.position !== undefined && offset.position < 0) {
      return err("Offset position must be non-negative");
    }
  }

  // Validate position_ms
  if (positionMs !== undefined && positionMs < 0) {
    return err("Position must be non-negative");
  }

  try {
    // SDK requires device_id but API allows undefined - using empty string as workaround
    await client.player.startResumePlayback(deviceId || "", contextUri, uris, offset, positionMs);

    return ok({
      message: "Playback started successfully",
    });
  } catch (error) {
    return err(
      `Failed to start/resume playback: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const startResumePlaybackSchema = {
  deviceId: z.string().optional().describe("The ID of the device this command is targeting"),
  contextUri: z
    .string()
    .optional()
    .describe("Spotify URI of the context to play (album, artist, playlist, show, episode)"),
  uris: z.array(z.string()).optional().describe("Array of Spotify track or episode URIs to play"),
  offset: z
    .object({
      position: z.number().optional().describe("Zero-based index of the item to start playing at"),
      uri: z.string().optional().describe("URI of the item to start playing at"),
    })
    .optional()
    .describe("Indicates from where in the context playback should start"),
  positionMs: z.number().optional().describe("The position in milliseconds to seek to"),
} as const;

type StartResumePlaybackInput = z.infer<z.ZodObject<typeof startResumePlaybackSchema>>;

export const createStartResumePlaybackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof startResumePlaybackSchema> => ({
  name: "start_resume_playback",
  title: "Start/Resume Playback",
  description: "Start a new context or resume current playback on the user's active device",
  inputSchema: startResumePlaybackSchema,
  handler: async (input: StartResumePlaybackInput): Promise<CallToolResult> => {
    const result = await startResumePlayback(
      spotifyClient,
      input.deviceId,
      input.contextUri,
      input.uris,
      input.offset,
      input.positionMs,
    );

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
