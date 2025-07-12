import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetTrackAudioFeaturesTool } from "./getAudioFeatures.ts";

describe("get-track-audio-features tool", () => {
  const mockClient = {
    tracks: {
      audioFeatures: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should get audio features successfully", async () => {
    const mockAudioFeatures = {
      danceability: 0.735,
      energy: 0.578,
      key: 5,
      loudness: -11.84,
      mode: 0,
      speechiness: 0.0461,
      acousticness: 0.514,
      instrumentalness: 0.0902,
      liveness: 0.159,
      valence: 0.636,
      tempo: 98.002,
      type: "audio_features",
      id: "11dFghVXANMlKmJXsNCbNl",
      uri: "spotify:track:11dFghVXANMlKmJXsNCbNl",
      track_href: "https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl",
      analysis_url: "https://api.spotify.com/v1/audio-analysis/11dFghVXANMlKmJXsNCbNl",
      duration_ms: 207960,
      time_signature: 4,
    };
    vi.mocked(mockClient.tracks.audioFeatures).mockResolvedValue(mockAudioFeatures as any);

    const tool = createGetTrackAudioFeaturesTool(mockClient);
    const result = await tool.handler({ id: "11dFghVXANMlKmJXsNCbNl" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockAudioFeatures);
    expect(mockClient.tracks.audioFeatures).toHaveBeenCalledWith("11dFghVXANMlKmJXsNCbNl");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.audioFeatures).mockRejectedValue(new Error("API request failed"));

    const tool = createGetTrackAudioFeaturesTool(mockClient);
    const result = await tool.handler({ id: "11dFghVXANMlKmJXsNCbNl" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get audio features: API request failed",
    );
  });

  it("should handle not found error", async () => {
    vi.mocked(mockClient.tracks.audioFeatures).mockResolvedValue(null as any);

    const tool = createGetTrackAudioFeaturesTool(mockClient);
    const result = await tool.handler({ id: "11dFghVXANMlKmJXsNCbNl" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Audio features not found for track");
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.tracks.audioFeatures).mockRejectedValue(new Error("Network error"));

    const tool = createGetTrackAudioFeaturesTool(mockClient);
    const result = await tool.handler({ id: "invalid" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get audio features: Network error",
    );
  });
});
