import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

async function getCurrentlyPlayingTrack(
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
    const currentlyPlaying = await client.player.getCurrentlyPlayingTrack(
      market as Market,
      additionalTypes?.join(","),
    );

    if (!currentlyPlaying || !currentlyPlaying.item) {
      return ok({
        message: "No track currently playing",
        is_playing: false,
      });
    }

    return ok({
      is_playing: currentlyPlaying.is_playing,
      progress_ms: currentlyPlaying.progress_ms,
      timestamp: currentlyPlaying.timestamp,
      currently_playing_type: currentlyPlaying.currently_playing_type,
      context: currentlyPlaying.context
        ? {
            type: currentlyPlaying.context.type,
            href: currentlyPlaying.context.href,
            uri: currentlyPlaying.context.uri,
          }
        : null,
      item: {
        id: currentlyPlaying.item.id,
        name: currentlyPlaying.item.name,
        type: currentlyPlaying.item.type,
        uri: currentlyPlaying.item.uri,
        duration_ms:
          "duration_ms" in currentlyPlaying.item ? currentlyPlaying.item.duration_ms : undefined,
        artists:
          "artists" in currentlyPlaying.item
            ? currentlyPlaying.item.artists.map((artist) => ({
                id: artist.id,
                name: artist.name,
              }))
            : undefined,
        album:
          "album" in currentlyPlaying.item
            ? {
                id: currentlyPlaying.item.album.id,
                name: currentlyPlaying.item.album.name,
                images: currentlyPlaying.item.album.images,
              }
            : undefined,
        show:
          "show" in currentlyPlaying.item
            ? {
                id: currentlyPlaying.item.show.id,
                name: currentlyPlaying.item.show.name,
              }
            : undefined,
      },
      actions: currentlyPlaying.actions,
    });
  } catch (error) {
    return err(
      `Failed to get currently playing track: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getCurrentlyPlayingTrackSchema = {
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

type GetCurrentlyPlayingTrackInput = z.infer<z.ZodObject<typeof getCurrentlyPlayingTrackSchema>>;

export const createGetCurrentlyPlayingTrackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getCurrentlyPlayingTrackSchema> => ({
  name: "get_currently_playing_track",
  title: "Get Currently Playing Track",
  description: "Get the object currently being played on the user's Spotify account",
  inputSchema: getCurrentlyPlayingTrackSchema,
  handler: async (input: GetCurrentlyPlayingTrackInput): Promise<CallToolResult> => {
    const result = await getCurrentlyPlayingTrack(
      spotifyClient,
      input.market,
      input.additionalTypes,
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
