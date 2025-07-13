import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetFeaturedPlaylistsTool } from "./getFeatured.ts";

describe("get-featured-playlists", () => {
  const mockClient = {
    browse: {
      getFeaturedPlaylists: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const getFeaturedPlaylistsTool = createGetFeaturedPlaylistsTool(mockClient);

  it("should get featured playlists with default parameters", async () => {
    const mockResponse = {
      message: "Popular Playlists",
      playlists: {
        items: [
          {
            id: "playlist1",
            name: "Today's Top Hits",
            description: "The most played tracks right now",
            public: true,
            collaborative: false,
            owner: { id: "spotify", display_name: "Spotify" },
            tracks: { total: 50 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
          },
          {
            id: "playlist2",
            name: "Global Top 50",
            description: "The most played tracks around the world",
            public: true,
            collaborative: false,
            owner: { id: "spotify", display_name: "Spotify" },
            tracks: { total: 50 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist2" },
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        href: "https://api.spotify.com/v1/browse/featured-playlists",
        next: null,
        previous: null,
      },
    };

    vi.mocked(mockClient.browse.getFeaturedPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getFeaturedPlaylistsTool.handler({});

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.message).toBe("Popular Playlists");
    expect(response.playlists).toHaveLength(2);
    expect(response.playlists[0]).toEqual({
      id: "playlist1",
      name: "Today's Top Hits",
      description: "The most played tracks right now",
      public: true,
      collaborative: false,
      owner: "Spotify",
      total_tracks: 50,
      external_url: "https://open.spotify.com/playlist/playlist1",
    });

    expect(response.total).toBe(2);
    expect(response.limit).toBe(20);
    expect(response.offset).toBe(0);
    expect(response.has_more).toBe(false);

    expect(mockClient.browse.getFeaturedPlaylists).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      20,
      0,
    );
  });

  it("should handle country and locale parameters", async () => {
    const mockResponse = {
      message: "Beliebte Playlists",
      playlists: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        href: "https://api.spotify.com/v1/browse/featured-playlists",
        next: null,
        previous: null,
      },
    };

    vi.mocked(mockClient.browse.getFeaturedPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getFeaturedPlaylistsTool.handler({
      country: "DE",
      locale: "de_DE",
      limit: 10,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.message).toBe("Beliebte Playlists");

    expect(mockClient.browse.getFeaturedPlaylists).toHaveBeenCalledWith(
      "DE",
      "de_DE",
      undefined,
      10,
      0,
    );
  });

  it("should handle timestamp parameter", async () => {
    const timestamp = "2024-01-15T10:00:00";
    const mockResponse = {
      message: "Monday Morning",
      playlists: {
        items: [],
        total: 5,
        limit: 20,
        offset: 0,
        href: "https://api.spotify.com/v1/browse/featured-playlists",
        next: null,
        previous: null,
      },
    };

    vi.mocked(mockClient.browse.getFeaturedPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getFeaturedPlaylistsTool.handler({
      timestamp,
    });

    expect(result.isError).not.toBe(true);

    // Note: The SDK doesn't support timestamp parameter, so we can't verify it's passed
    expect(mockClient.browse.getFeaturedPlaylists).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      20,
      0,
    );
  });

  it("should handle pagination", async () => {
    const mockResponse = {
      message: "Featured",
      playlists: {
        items: [],
        total: 100,
        limit: 5,
        offset: 10,
        href: "https://api.spotify.com/v1/browse/featured-playlists",
        next: "https://api.spotify.com/v1/browse/featured-playlists?offset=15&limit=5",
        previous: "https://api.spotify.com/v1/browse/featured-playlists?offset=5&limit=5",
      },
    };

    vi.mocked(mockClient.browse.getFeaturedPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getFeaturedPlaylistsTool.handler({
      limit: 5,
      offset: 10,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.limit).toBe(5);
    expect(response.offset).toBe(10);
    expect(response.has_more).toBe(true);
  });

  it("should handle invalid limit", async () => {
    const result = await getFeaturedPlaylistsTool.handler({
      limit: 60,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Limit must be between 1 and 50");
  });

  it("should handle negative offset", async () => {
    const result = await getFeaturedPlaylistsTool.handler({
      offset: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Offset must be a non-negative number");
  });

  it("should handle invalid country code", async () => {
    const result = await getFeaturedPlaylistsTool.handler({
      country: "USA", // Should be "US"
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Country must be a valid ISO 3166-1 alpha-2");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.browse.getFeaturedPlaylists).mockRejectedValueOnce(
      new Error("Service unavailable"),
    );

    const result = await getFeaturedPlaylistsTool.handler({});

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get featured playlists: Service unavailable",
    );
  });
});
