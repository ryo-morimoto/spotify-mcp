import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, AudioAnalysis } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

const getTrackAudioAnalysisSchema = {
  id: z.string().describe("The Spotify ID of the track"),
} as const;

type GetTrackAudioAnalysisInput = z.infer<z.ZodObject<typeof getTrackAudioAnalysisSchema>>;

async function getTrackAudioAnalysis(
  client: SpotifyApi,
  id: string,
): Promise<Result<AudioAnalysis, string>> {
  try {
    const audioAnalysis = await client.tracks.audioAnalysis(id);
    return ok(audioAnalysis);
  } catch (error) {
    return err(
      `Failed to get audio analysis: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetTrackAudioAnalysisTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getTrackAudioAnalysisSchema> => ({
  name: "get_track_audio_analysis",
  title: "Get Track's Audio Analysis",
  description:
    "Get a low-level audio analysis for a track in the Spotify catalog. " +
    "The audio analysis describes the track's structure and musical content, including rhythm, pitch, and timbre.",
  inputSchema: getTrackAudioAnalysisSchema,
  handler: async (input: GetTrackAudioAnalysisInput): Promise<CallToolResult> => {
    const result = await getTrackAudioAnalysis(spotifyClient, input.id);

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

    const uri = createResourceUri("track", input.id, undefined, "audio-analysis");
    return createResourceResponse(uri, result.value);
  },
});
