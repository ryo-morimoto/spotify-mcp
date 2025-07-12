import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { getArtistTopTracks } from "./getArtistTopTracks.ts";

describe("getArtistTopTracks", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      artists: {
        topTracks: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should get artist's top tracks successfully", async () => {
    const mockTracks: Track[] = [
      {
        id: "track1",
        name: "Popular Song 1",
        artists: [{ name: "Artist Name", id: "artist1", type: "artist" }],
        album: {
          id: "album1",
          name: "Album 1",
          images: [{ url: "https://image1.jpg", height: 300, width: 300 }],
          type: "album",
        },
        duration_ms: 240000,
        popularity: 85,
        external_urls: { spotify: "https://spotify.com/track1" },
        type: "track",
        uri: "spotify:track:track1",
        href: "https://api.spotify.com/v1/tracks/track1",
      } as unknown as Track,
      {
        id: "track2",
        name: "Popular Song 2",
        artists: [{ name: "Artist Name", id: "artist1", type: "artist" }],
        album: {
          id: "album2",
          name: "Album 2",
          images: [{ url: "https://image2.jpg", height: 300, width: 300 }],
          type: "album",
        },
        duration_ms: 180000,
        popularity: 80,
        external_urls: { spotify: "https://spotify.com/track2" },
        type: "track",
        uri: "spotify:track:track2",
        href: "https://api.spotify.com/v1/tracks/track2",
      } as unknown as Track,
    ];

    vi.mocked(mockClient.artists.topTracks).mockResolvedValue({
      tracks: mockTracks,
    });

    const result = await getArtistTopTracks(mockClient, "artist1", "US");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("track1");
      expect(result.value[0].name).toBe("Popular Song 1");
      expect(result.value[0].popularity).toBe(85);
      expect(result.value[1].id).toBe("track2");
      expect(result.value[1].name).toBe("Popular Song 2");
      expect(result.value[1].popularity).toBe(80);
    }
    expect(mockClient.artists.topTracks).toHaveBeenCalledWith("artist1", "US");
  });

  it("should return error for empty artist ID", async () => {
    const result = await getArtistTopTracks(mockClient, "", "US");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Artist ID must not be empty");
    }
    expect(mockClient.artists.topTracks).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    const result = await getArtistTopTracks(mockClient, "artist1", "USA");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
    expect(mockClient.artists.topTracks).not.toHaveBeenCalled();
  });

  it("should return error for missing market parameter", async () => {
    const result = await getArtistTopTracks(mockClient, "artist1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market parameter is required for top tracks");
    }
    expect(mockClient.artists.topTracks).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.topTracks).mockRejectedValue(new Error("API Error"));

    const result = await getArtistTopTracks(mockClient, "artist1", "US");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get artist's top tracks: API Error");
    }
  });

  it("should format duration correctly", async () => {
    const mockTrack: Track = {
      id: "track1",
      name: "Song",
      artists: [{ name: "Artist", id: "artist1", type: "artist" }],
      album: {
        id: "album1",
        name: "Album",
        images: [],
        type: "album",
      },
      duration_ms: 195000, // 3:15
      popularity: 75,
      external_urls: { spotify: "https://spotify.com/track1" },
      type: "track",
      uri: "spotify:track:track1",
      href: "https://api.spotify.com/v1/tracks/track1",
    } as unknown as Track;

    vi.mocked(mockClient.artists.topTracks).mockResolvedValue({
      tracks: [mockTrack],
    });

    const result = await getArtistTopTracks(mockClient, "artist1", "US");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].duration).toBe("3:15");
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
        type: "album",
      },
      duration_ms: 200000,
      popularity: 90,
      external_urls: { spotify: "https://spotify.com/track1" },
      type: "track",
      uri: "spotify:track:track1",
      href: "https://api.spotify.com/v1/tracks/track1",
    } as unknown as Track;

    vi.mocked(mockClient.artists.topTracks).mockResolvedValue({
      tracks: [mockTrack],
    });

    const result = await getArtistTopTracks(mockClient, "artist1", "US");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].artists).toBe("Artist 1, Artist 2, Artist 3");
    }
  });

  it("should handle empty response", async () => {
    vi.mocked(mockClient.artists.topTracks).mockResolvedValue({
      tracks: [],
    });

    const result = await getArtistTopTracks(mockClient, "artist1", "US");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });
});
