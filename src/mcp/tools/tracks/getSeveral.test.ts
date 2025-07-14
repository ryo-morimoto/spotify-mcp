import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import { createGetSeveralTracksTool } from "@mcp/tools/tracks/getSeveral.ts";

describe("getSeveralTracks", () => {
  let mockClient: SpotifyApi;
  let getSeveralTracksTool: ReturnType<typeof createGetSeveralTracksTool>;

  beforeEach(() => {
    mockClient = {
      tracks: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;
    getSeveralTracksTool = createGetSeveralTracksTool(mockClient);
  });

  it("should get multiple tracks successfully", async () => {
    const mockTracks: Track[] = [
      {
        id: "track1",
        name: "Song One",
        artists: [{ name: "Artist 1", id: "artist1", type: "artist" }],
        album: {
          id: "album1",
          name: "Album 1",
          images: [{ url: "https://image1.jpg", height: 300, width: 300 }],
          release_date: "2023-01-01",
          type: "album",
        },
        duration_ms: 240000,
        preview_url: "https://preview1.mp3",
        external_urls: { spotify: "https://spotify.com/track1" },
        type: "track",
        uri: "spotify:track:track1",
        href: "https://api.spotify.com/v1/tracks/track1",
      } as unknown as Track,
      {
        id: "track2",
        name: "Song Two",
        artists: [{ name: "Artist 2", id: "artist2", type: "artist" }],
        album: {
          id: "album2",
          name: "Album 2",
          images: [{ url: "https://image2.jpg", height: 300, width: 300 }],
          release_date: "2023-02-01",
          type: "album",
        },
        duration_ms: 180000,
        preview_url: null,
        external_urls: { spotify: "https://spotify.com/track2" },
        type: "track",
        uri: "spotify:track:track2",
        href: "https://api.spotify.com/v1/tracks/track2",
      } as unknown as Track,
    ];

    vi.mocked(mockClient.tracks.get).mockResolvedValue(mockTracks);

    const result = await getSeveralTracksTool.handler({ trackIds: ["track1", "track2"] });

    expect(result.isError).not.toBe(true);
    const content = JSON.parse(result.content[0].text as string);
    expect(content).toHaveLength(2);
    expect(content[0].id).toBe("track1");
    expect(content[0].name).toBe("Song One");
    expect(content[0].artists).toBe("Artist 1");
    expect(content[0].album).toBe("Album 1");
    expect(content[0].duration_ms).toBe(240000);
    expect(content[0].preview_url).toBe("https://preview1.mp3");
    expect(content[1].id).toBe("track2");
    expect(content[1].name).toBe("Song Two");
    expect(content[1].preview_url).toBe(null);
    expect(mockClient.tracks.get).toHaveBeenCalledWith(["track1", "track2"], undefined);
  });

  it("should handle market parameter", async () => {
    const mockTrack: Track = {
      id: "track1",
      name: "Song",
      artists: [{ name: "Artist", id: "artist1", type: "artist" }],
      album: {
        id: "album1",
        name: "Album",
        images: [],
        release_date: "2023-01-01",
        type: "album",
      },
      duration_ms: 200000,
      preview_url: null,
      external_urls: { spotify: "https://spotify.com/track1" },
      type: "track",
      uri: "spotify:track:track1",
      href: "https://api.spotify.com/v1/tracks/track1",
    } as unknown as Track;

    vi.mocked(mockClient.tracks.get).mockResolvedValue([mockTrack]);

    const result = await getSeveralTracksTool.handler({ trackIds: ["track1"], market: "US" });

    expect(result.isError).not.toBe(true);
    expect(mockClient.tracks.get).toHaveBeenCalledWith(["track1"], "US");
  });

  it("should return error for empty track IDs array", async () => {
    const result = await getSeveralTracksTool.handler({ trackIds: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Track IDs must not be empty");
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for too many track IDs", async () => {
    const tooManyIds = Array.from({ length: 51 }, (_, i) => `track${i}`);
    const result = await getSeveralTracksTool.handler({ trackIds: tooManyIds });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Maximum 50 track IDs allowed");
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid track ID", async () => {
    const result = await getSeveralTracksTool.handler({ trackIds: ["valid", "", "also_valid"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: All track IDs must be non-empty strings");
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    const result = await getSeveralTracksTool.handler({ trackIds: ["track1"], market: "USA" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.get).mockRejectedValue(new Error("API Error"));

    const result = await getSeveralTracksTool.handler({ trackIds: ["track1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Failed to get tracks: API Error");
  });

  it("should handle tracks with multiple artists", async () => {
    const mockTrack: Track = {
      id: "track1",
      name: "Collaboration",
      artists: [
        { name: "Artist 1", id: "artist1", type: "artist" },
        { name: "Artist 2", id: "artist2", type: "artist" },
        { name: "Artist 3", id: "artist3", type: "artist" },
      ],
      album: {
        id: "album1",
        name: "Album",
        images: [],
        release_date: "2023-01-01",
        type: "album",
      },
      duration_ms: 200000,
      preview_url: null,
      external_urls: { spotify: "https://spotify.com/track1" },
      type: "track",
      uri: "spotify:track:track1",
      href: "https://api.spotify.com/v1/tracks/track1",
    } as unknown as Track;

    vi.mocked(mockClient.tracks.get).mockResolvedValue([mockTrack]);

    const result = await getSeveralTracksTool.handler({ trackIds: ["track1"] });

    expect(result.isError).not.toBe(true);
    const content = JSON.parse(result.content[0].text as string);
    expect(content[0].artists).toBe("Artist 1, Artist 2, Artist 3");
  });

  it("should handle empty response", async () => {
    vi.mocked(mockClient.tracks.get).mockResolvedValue([]);

    const result = await getSeveralTracksTool.handler({ trackIds: ["track1"] });

    expect(result.isError).not.toBe(true);
    const content = JSON.parse(result.content[0].text as string);
    expect(content).toHaveLength(0);
  });
});

describe("createGetSeveralTracksTool", () => {
  const mockSpotifyClient = {} as any;
  const tool = createGetSeveralTracksTool(mockSpotifyClient);
  it("should have correct input schema", () => {
    const schema = z.object(tool.inputSchema);

    // Valid input
    const validInput = {
      trackIds: ["track1", "track2"],
      market: "US",
    };
    expect(() => schema.parse(validInput)).not.toThrow();

    // Valid input without market
    const validInputNoMarket = {
      trackIds: ["track1"],
    };
    expect(() => schema.parse(validInputNoMarket)).not.toThrow();

    // Invalid: empty array
    const invalidEmptyArray = {
      trackIds: [],
    };
    expect(() => schema.parse(invalidEmptyArray)).toThrow();

    // Invalid: too many IDs
    const invalidTooMany = {
      trackIds: Array.from({ length: 51 }, (_, i) => `track${i}`),
    };
    expect(() => schema.parse(invalidTooMany)).toThrow();

    // Invalid: invalid market code
    const invalidMarket = {
      trackIds: ["track1"],
      market: "USA",
    };
    expect(() => schema.parse(invalidMarket)).toThrow();

    // Invalid: lowercase market code
    const invalidLowercaseMarket = {
      trackIds: ["track1"],
      market: "us",
    };
    expect(() => schema.parse(invalidLowercaseMarket)).toThrow();
  });
});
