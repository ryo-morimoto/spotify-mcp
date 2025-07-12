import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { getSeveralTracks } from "./getSeveralTracks.ts";

describe("getSeveralTracks", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      tracks: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;
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

    const result = await getSeveralTracks(mockClient, ["track1", "track2"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("track1");
      expect(result.value[0].name).toBe("Song One");
      expect(result.value[0].artists).toBe("Artist 1");
      expect(result.value[0].album).toBe("Album 1");
      expect(result.value[0].duration_ms).toBe(240000);
      expect(result.value[0].preview_url).toBe("https://preview1.mp3");
      expect(result.value[1].id).toBe("track2");
      expect(result.value[1].name).toBe("Song Two");
      expect(result.value[1].preview_url).toBe(null);
    }
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

    const result = await getSeveralTracks(mockClient, ["track1"], "US");

    expect(result.isOk()).toBe(true);
    expect(mockClient.tracks.get).toHaveBeenCalledWith(["track1"], "US");
  });

  it("should return error for empty track IDs array", async () => {
    const result = await getSeveralTracks(mockClient, []);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Track IDs must not be empty");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for too many track IDs", async () => {
    const tooManyIds = Array.from({ length: 51 }, (_, i) => `track${i}`);
    const result = await getSeveralTracks(mockClient, tooManyIds);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 50 track IDs allowed");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid track ID", async () => {
    const result = await getSeveralTracks(mockClient, ["valid", "", "also_valid"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("All track IDs must be non-empty strings");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    const result = await getSeveralTracks(mockClient, ["track1"], "USA");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.get).mockRejectedValue(new Error("API Error"));

    const result = await getSeveralTracks(mockClient, ["track1"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get tracks: API Error");
    }
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

    const result = await getSeveralTracks(mockClient, ["track1"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].artists).toBe("Artist 1, Artist 2, Artist 3");
    }
  });

  it("should handle empty response", async () => {
    vi.mocked(mockClient.tracks.get).mockResolvedValue([]);

    const result = await getSeveralTracks(mockClient, ["track1"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });
});
