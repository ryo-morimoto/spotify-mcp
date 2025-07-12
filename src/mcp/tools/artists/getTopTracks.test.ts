import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import { createGetArtistTopTracksTool } from "./getTopTracks.ts";

describe("getArtistTopTracks", () => {
  let mockClient: SpotifyApi;
  let tool: ReturnType<typeof createGetArtistTopTracksTool>;

  beforeEach(() => {
    mockClient = {
      artists: {
        topTracks: vi.fn(),
      },
    } as unknown as SpotifyApi;
    tool = createGetArtistTopTracksTool(mockClient);
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

    const result = await tool.handler({ artistId: "artist1", market: "US" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content).toHaveLength(2);
    expect(content[0].id).toBe("track1");
    expect(content[0].name).toBe("Popular Song 1");
    expect(content[0].popularity).toBe(85);
    expect(content[1].id).toBe("track2");
    expect(content[1].name).toBe("Popular Song 2");
    expect(content[1].popularity).toBe(80);
    expect(mockClient.artists.topTracks).toHaveBeenCalledWith("artist1", "US");
  });

  it("should return error for empty artist ID", async () => {
    const result = await tool.handler({ artistId: "", market: "US" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Artist ID must not be empty");
    expect(mockClient.artists.topTracks).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    // This should be caught by zod validation, not the internal function
    expect(() => {
      const schema = z.object(tool.inputSchema);
      schema.parse({ artistId: "artist1", market: "USA" });
    }).toThrow();
  });

  it("should return error for missing market parameter", async () => {
    // This should be caught by zod validation
    expect(() => {
      const schema = z.object(tool.inputSchema);
      schema.parse({ artistId: "artist1" });
    }).toThrow();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.topTracks).mockRejectedValue(new Error("API Error"));

    const result = await tool.handler({ artistId: "artist1", market: "US" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Failed to get artist's top tracks: API Error");
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

    const result = await tool.handler({ artistId: "artist1", market: "US" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content[0].duration).toBe("3:15");
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

    const result = await tool.handler({ artistId: "artist1", market: "US" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content[0].artists).toBe("Artist 1, Artist 2, Artist 3");
  });

  it("should handle empty response", async () => {
    vi.mocked(mockClient.artists.topTracks).mockResolvedValue({
      tracks: [],
    });

    const result = await tool.handler({ artistId: "artist1", market: "US" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content).toHaveLength(0);
  });
});

describe("createGetArtistTopTracksTool", () => {
  const mockSpotifyClient = {} as any;
  const tool = createGetArtistTopTracksTool(mockSpotifyClient);

  it("should create tool with correct metadata", () => {
    expect(tool.name).toBe("get_artist_top_tracks");
    expect(tool.title).toBe("Get Artist's Top Tracks");
    expect(tool.description).toBe("Get the top tracks of an artist on Spotify by country");
  });

  it("should have correct input schema", () => {
    const schema = z.object(tool.inputSchema);

    // Valid input
    const validInput = {
      artistId: "artist123",
      market: "US",
    };
    expect(() => schema.parse(validInput)).not.toThrow();

    // Invalid: missing artistId
    const invalidMissingArtist = {
      market: "US",
    };
    expect(() => schema.parse(invalidMissingArtist)).toThrow();

    // Invalid: missing market (required for this endpoint)
    const invalidMissingMarket = {
      artistId: "artist123",
    };
    expect(() => schema.parse(invalidMissingMarket)).toThrow();

    // Invalid: invalid market code (3 letters)
    const invalidMarketThreeLetters = {
      artistId: "artist123",
      market: "USA",
    };
    expect(() => schema.parse(invalidMarketThreeLetters)).toThrow();

    // Invalid: lowercase market code
    const invalidLowercaseMarket = {
      artistId: "artist123",
      market: "us",
    };
    expect(() => schema.parse(invalidLowercaseMarket)).toThrow();

    // Invalid: numeric market code
    const invalidNumericMarket = {
      artistId: "artist123",
      market: "12",
    };
    expect(() => schema.parse(invalidNumericMarket)).toThrow();
  });
});
