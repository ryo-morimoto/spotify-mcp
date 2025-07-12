import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, AudioFeatures } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const getSeveralTracksAudioFeaturesSchema = {
  ids: z.array(z.string()).min(1).max(100).describe("Array of Spotify track IDs (maximum 100)"),
} as const;

type GetSeveralTracksAudioFeaturesInput = z.infer<
  z.ZodObject<typeof getSeveralTracksAudioFeaturesSchema>
>;

// Export for testing
export async function getSeveralTracksAudioFeatures(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<AudioFeatures[], string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one track ID is required");
  }
  if (ids.length > 100) {
    return err("Maximum 100 track IDs allowed");
  }

  try {
    const audioFeatures = await client.tracks.audioFeatures(ids);
    // Filter out null values (invalid track IDs return null)
    const validAudioFeatures = audioFeatures.filter(
      (features): features is AudioFeatures => features !== null,
    );
    return ok(validAudioFeatures);
  } catch (error) {
    return err(
      `Failed to get audio features: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetSeveralTracksAudioFeaturesTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSeveralTracksAudioFeaturesSchema> => ({
  name: "get_several_tracks_audio_features",
  title: "Get Several Tracks' Audio Features",
  description:
    "Get audio features for multiple tracks based on their Spotify IDs. " +
    "Audio features include danceability, energy, key, loudness, mode, speechiness, " +
    "acousticness, instrumentalness, liveness, valence, tempo, duration, and time signature.",
  inputSchema: getSeveralTracksAudioFeaturesSchema,
  handler: async (input: GetSeveralTracksAudioFeaturesInput): Promise<CallToolResult> => {
    const result = await getSeveralTracksAudioFeatures(spotifyClient, input.ids);

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
