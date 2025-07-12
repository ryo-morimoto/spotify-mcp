import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import {
  getSeveralTracksAudioFeatures,
  createGetSeveralTracksAudioFeaturesTool,
} from "./getSeveralAudioFeatures.ts";

describe("getSeveralTracksAudioFeatures", () => {
  const mockClient = {
    tracks: {
      audioFeatures: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should get multiple audio features successfully", async () => {
    const mockAudioFeatures = [
      {
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
        id: "track1",
        uri: "spotify:track:track1",
        track_href: "https://api.spotify.com/v1/tracks/track1",
        analysis_url: "https://api.spotify.com/v1/audio-analysis/track1",
        duration_ms: 207960,
        time_signature: 4,
      },
      {
        danceability: 0.825,
        energy: 0.652,
        key: 1,
        loudness: -5.883,
        mode: 1,
        speechiness: 0.0284,
        acousticness: 0.165,
        instrumentalness: 0.00146,
        liveness: 0.0986,
        valence: 0.915,
        tempo: 124.03,
        type: "audio_features",
        id: "track2",
        uri: "spotify:track:track2",
        track_href: "https://api.spotify.com/v1/tracks/track2",
        analysis_url: "https://api.spotify.com/v1/audio-analysis/track2",
        duration_ms: 213573,
        time_signature: 4,
      },
    ];
    vi.mocked(mockClient.tracks.audioFeatures).mockResolvedValue(mockAudioFeatures as any);

    const result = await getSeveralTracksAudioFeatures(mockClient, ["track1", "track2"]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockAudioFeatures);
    }
    expect(mockClient.tracks.audioFeatures).toHaveBeenCalledWith(["track1", "track2"]);
  });

  it("should validate empty array", async () => {
    const result = await getSeveralTracksAudioFeatures(mockClient, []);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one track ID is required");
    }
  });

  it("should validate maximum 100 tracks", async () => {
    const ids = Array(101).fill("track");
    const result = await getSeveralTracksAudioFeatures(mockClient, ids);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 100 track IDs allowed");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.audioFeatures).mockRejectedValue(new Error("API request failed"));

    const result = await getSeveralTracksAudioFeatures(mockClient, ["track1"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to get audio features: API request failed");
    }
  });

  it("should filter out null values", async () => {
    const mockResponse = [
      {
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
        id: "track1",
        uri: "spotify:track:track1",
        track_href: "https://api.spotify.com/v1/tracks/track1",
        analysis_url: "https://api.spotify.com/v1/audio-analysis/track1",
        duration_ms: 207960,
        time_signature: 4,
      },
      null,
      {
        danceability: 0.825,
        energy: 0.652,
        key: 1,
        loudness: -5.883,
        mode: 1,
        speechiness: 0.0284,
        acousticness: 0.165,
        instrumentalness: 0.00146,
        liveness: 0.0986,
        valence: 0.915,
        tempo: 124.03,
        type: "audio_features",
        id: "track3",
        uri: "spotify:track:track3",
        track_href: "https://api.spotify.com/v1/tracks/track3",
        analysis_url: "https://api.spotify.com/v1/audio-analysis/track3",
        duration_ms: 213573,
        time_signature: 4,
      },
    ];
    vi.mocked(mockClient.tracks.audioFeatures).mockResolvedValue(mockResponse as any);

    const result = await getSeveralTracksAudioFeatures(mockClient, ["track1", "invalid", "track3"]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("track1");
      expect(result.value[1].id).toBe("track3");
    }
  });
});

describe("createGetSeveralTracksAudioFeaturesTool", () => {
  const mockClient = {
    tracks: {
      audioFeatures: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createGetSeveralTracksAudioFeaturesTool(mockClient);
    expect(tool.name).toBe("get-several-tracks-audio-features");
    expect(tool.title).toBe("Get Several Tracks' Audio Features");
    expect(tool.description).toContain("Get audio features for multiple tracks");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful request", async () => {
    const mockAudioFeatures = [
      {
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
        id: "track1",
        uri: "spotify:track:track1",
        track_href: "https://api.spotify.com/v1/tracks/track1",
        analysis_url: "https://api.spotify.com/v1/audio-analysis/track1",
        duration_ms: 207960,
        time_signature: 4,
      },
    ];
    vi.mocked(mockClient.tracks.audioFeatures).mockResolvedValue(mockAudioFeatures as any);

    const tool = createGetSeveralTracksAudioFeaturesTool(mockClient);
    const result = await tool.handler({ ids: ["track1"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockAudioFeatures);
  });

  it("should handle errors", async () => {
    const tool = createGetSeveralTracksAudioFeaturesTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
