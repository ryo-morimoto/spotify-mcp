import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

export type SpotifyTopTrackResult = {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration: string; // Format: "3:15"
  popularity: number;
  external_url: string;
};

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function getArtistTopTracks(
  client: SpotifyApi,
  artistId: string,
  market?: string,
): Promise<Result<SpotifyTopTrackResult[], string>> {
  // Validate artist ID
  if (!artistId.trim()) {
    return err("Artist ID must not be empty");
  }

  // Market is required for top tracks endpoint
  if (!market) {
    return err("Market parameter is required for top tracks");
  }

  // Validate market parameter
  // ISO 3166-1 alpha-2 country code validation (2 uppercase letters)
  if (!/^[A-Z]{2}$/.test(market)) {
    return err("Market must be a valid ISO 3166-1 alpha-2 country code");
  }

  try {
    const response = await client.artists.topTracks(artistId, market as Market);
    const results: SpotifyTopTrackResult[] = response.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      duration: formatDuration(track.duration_ms),
      popularity: track.popularity,
      external_url: track.external_urls.spotify,
    }));
    return ok(results);
  } catch (error) {
    return err(
      `Failed to get artist's top tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getArtistTopTracksSchema = {
  artistId: z.string().describe("Spotify artist ID"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .describe("ISO 3166-1 alpha-2 country code (required, e.g., 'US', 'JP')"),
} as const;

type GetArtistTopTracksInput = z.infer<z.ZodObject<typeof getArtistTopTracksSchema>>;

export const createGetArtistTopTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getArtistTopTracksSchema> => ({
  name: "get-artist-top-tracks",
  title: "Get Artist's Top Tracks",
  description: "Get the top tracks of an artist on Spotify by country",
  inputSchema: getArtistTopTracksSchema,
  handler: async (input: GetArtistTopTracksInput): Promise<CallToolResult> => {
    const result = await getArtistTopTracks(spotifyClient, input.artistId, input.market);

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
