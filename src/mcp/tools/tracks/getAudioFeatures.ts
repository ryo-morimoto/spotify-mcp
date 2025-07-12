import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, AudioFeatures } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const getTrackAudioFeaturesSchema = {
  id: z.string().describe("The Spotify ID of the track"),
} as const;

type GetTrackAudioFeaturesInput = z.infer<z.ZodObject<typeof getTrackAudioFeaturesSchema>>;

async function getTrackAudioFeatures(
  client: SpotifyApi,
  id: string,
): Promise<Result<AudioFeatures, string>> {
  try {
    const audioFeatures = await client.tracks.audioFeatures(id);
    if (!audioFeatures) {
      return err("Audio features not found for track");
    }
    return ok(audioFeatures);
  } catch (error) {
    return err(
      `Failed to get audio features: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetTrackAudioFeaturesTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getTrackAudioFeaturesSchema> => ({
  name: "get_track_audio_features",
  title: "Get Track's Audio Features",
  description:
    "Get audio feature information for a single track identified by its unique Spotify ID. " +
    "Audio features include danceability, energy, key, loudness, mode, speechiness, acousticness, " +
    "instrumentalness, liveness, valence, tempo, duration, and time signature.",
  inputSchema: getTrackAudioFeaturesSchema,
  handler: async (input: GetTrackAudioFeaturesInput): Promise<CallToolResult> => {
    const result = await getTrackAudioFeatures(spotifyClient, input.id);

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
