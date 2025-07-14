import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function getPlaybackState(
  client: SpotifyApi,
  market?: string,
  additionalTypes?: string[],
): Promise<Result<any, string>> {
  // Validate market parameter if provided
  if (market !== undefined) {
    // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  // Validate additional types if provided
  if (additionalTypes !== undefined) {
    const validTypes = ["track", "episode"];
    for (const type of additionalTypes) {
      if (!validTypes.includes(type)) {
        return err(`Invalid additional type: ${type}. Must be 'track' or 'episode'`);
      }
    }
  }

  try {
    const playbackState = await client.player.getPlaybackState(
      market as Market,
      additionalTypes?.join(","),
    );

    if (!playbackState) {
      return ok({
        message: "No active playback found",
        is_playing: false,
      });
    }

    return ok({
      is_playing: playbackState.is_playing,
      shuffle_state: playbackState.shuffle_state,
      repeat_state: playbackState.repeat_state,
      timestamp: playbackState.timestamp,
      progress_ms: playbackState.progress_ms,
      device: playbackState.device
        ? {
            id: playbackState.device.id,
            name: playbackState.device.name,
            type: playbackState.device.type,
            is_active: playbackState.device.is_active,
            is_private_session: playbackState.device.is_private_session,
            is_restricted: playbackState.device.is_restricted,
            volume_percent: playbackState.device.volume_percent,
          }
        : null,
      item: playbackState.item
        ? {
            id: playbackState.item.id,
            name: playbackState.item.name,
            type: playbackState.item.type,
            uri: playbackState.item.uri,
            duration_ms:
              "duration_ms" in playbackState.item ? playbackState.item.duration_ms : undefined,
            artists:
              "artists" in playbackState.item
                ? playbackState.item.artists.map((artist) => ({
                    id: artist.id,
                    name: artist.name,
                  }))
                : undefined,
            album:
              "album" in playbackState.item
                ? {
                    id: playbackState.item.album.id,
                    name: playbackState.item.album.name,
                    images: playbackState.item.album.images,
                  }
                : undefined,
            show:
              "show" in playbackState.item
                ? {
                    id: playbackState.item.show.id,
                    name: playbackState.item.show.name,
                  }
                : undefined,
          }
        : null,
      currently_playing_type: playbackState.currently_playing_type,
      actions: playbackState.actions,
      context: playbackState.context
        ? {
            type: playbackState.context.type,
            href: playbackState.context.href,
            uri: playbackState.context.uri,
          }
        : null,
    });
  } catch (error) {
    return err(
      `Failed to get playback state: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getPlaybackStateSchema = {
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
  additionalTypes: z
    .array(z.enum(["track", "episode"]))
    .optional()
    .describe("Additional types that should be returned in the response"),
} as const;

type GetPlaybackStateInput = z.infer<z.ZodObject<typeof getPlaybackStateSchema>>;

export const createGetPlaybackStateTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getPlaybackStateSchema> => ({
  name: "get_playback_state",
  title: "Get Playback State",
  description:
    "Get information about the user's current playback state, including track or episode, progress, and active device",
  inputSchema: getPlaybackStateSchema,
  handler: async (input: GetPlaybackStateInput): Promise<CallToolResult> => {
    const result = await getPlaybackState(spotifyClient, input.market, input.additionalTypes);

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
