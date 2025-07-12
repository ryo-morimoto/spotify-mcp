import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

// Export for testing
export async function getAvailableDevices(client: SpotifyApi): Promise<Result<any, string>> {
  try {
    const devices = await client.player.getAvailableDevices();

    return ok({
      devices: devices.devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        is_active: device.is_active,
        is_private_session: device.is_private_session,
        is_restricted: device.is_restricted,
        volume_percent: device.volume_percent,
      })),
    });
  } catch (error) {
    return err(
      `Failed to get available devices: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getAvailableDevicesSchema = {} as const;

type GetAvailableDevicesInput = z.infer<z.ZodObject<typeof getAvailableDevicesSchema>>;

export const createGetAvailableDevicesTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getAvailableDevicesSchema> => ({
  name: "get_available_devices",
  title: "Get Available Devices",
  description: "Get information about a user's available devices for Spotify playback",
  inputSchema: getAvailableDevicesSchema,
  handler: async (_input: GetAvailableDevicesInput): Promise<CallToolResult> => {
    const result = await getAvailableDevices(spotifyClient);

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
