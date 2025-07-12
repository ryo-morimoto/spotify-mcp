import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyTrackResult, ToolDefinition } from "../../../types.ts";
import { z } from "zod";

async function getSeveralTracks(
  client: SpotifyApi,
  trackIds: string[],
  market?: string,
): Promise<Result<SpotifyTrackResult[], string>> {
  // Validate track IDs array
  if (trackIds.length === 0) {
    return err("Track IDs must not be empty");
  }

  // Spotify API allows maximum 50 tracks at once
  if (trackIds.length > 50) {
    return err("Maximum 50 track IDs allowed");
  }

  // Validate each track ID
  if (trackIds.some((id) => !id.trim())) {
    return err("All track IDs must be non-empty strings");
  }

  // Validate market parameter if provided
  if (market !== undefined) {
    // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  try {
    const tracks = await client.tracks.get(trackIds, market as Market);
    const results: SpotifyTrackResult[] = tracks.map((track) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
    }));
    return ok(results);
  } catch (error) {
    return err(`Failed to get tracks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const getSeveralTracksSchema = {
  trackIds: z.array(z.string()).min(1).max(50).describe("Array of Spotify track IDs (maximum 50)"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetSeveralTracksInput = z.infer<z.ZodObject<typeof getSeveralTracksSchema>>;

export const createGetSeveralTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralTracksSchema> => ({
  name: "get_several_tracks",
  title: "Get Several Tracks",
  description: "Get multiple tracks by their IDs from Spotify (maximum 50 tracks)",
  inputSchema: getSeveralTracksSchema,
  handler: async (input: GetSeveralTracksInput): Promise<CallToolResult> => {
    const result = await getSeveralTracks(spotifyClient, input.trackIds, input.market);

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
