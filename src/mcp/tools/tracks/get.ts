import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyTrackResult, ToolDefinition } from "@types";
import { z } from "zod";

const getTrackSchema = {
  trackId: z.string().describe("Spotify track ID"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetTrackInput = z.infer<z.ZodObject<typeof getTrackSchema>>;

async function getTrack(
  client: SpotifyApi,
  trackId: string,
  market?: string,
): Promise<Result<SpotifyTrackResult, string>> {
  // Validate track ID
  if (!trackId.trim()) {
    return err("Track ID must not be empty");
  }

  // Validate market parameter if provided
  if (market !== undefined) {
    // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  try {
    const track = await client.tracks.get(trackId, market as Market);
    return ok({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
    });
  } catch (error) {
    return err(`Failed to get track: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createGetTrackTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getTrackSchema> => ({
  name: "get_track",
  title: "Get Track",
  description: "Get a single track by ID from Spotify",
  inputSchema: getTrackSchema,
  handler: async (input: GetTrackInput): Promise<CallToolResult> => {
    const result = await getTrack(spotifyClient, input.trackId, input.market);

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
