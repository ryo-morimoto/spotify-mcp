import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetCategoryPlaylistsTool } from "./getCategory.ts";

describe("get-category-playlists", () => {
  const mockClient = {
    browse: {
      getPlaylistsForCategory: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const getCategoryPlaylistsTool = createGetCategoryPlaylistsTool(mockClient);

  it("should get playlists for a category with default parameters", async () => {
    const mockResponse = {
      playlists: {
        items: [
          {
            id: "playlist1",
            name: "Rock Classics",
            description: "The best rock songs from the 70s and 80s",
            public: true,
            collaborative: false,
            owner: { id: "spotify", display_name: "Spotify" },
            tracks: { total: 100 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
          },
          {
            id: "playlist2",
            name: "Modern Rock",
            description: "Today's rock hits",
            public: true,
            collaborative: false,
            owner: { id: "spotify", display_name: "Spotify" },
            tracks: { total: 50 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist2" },
          },
        ],
        total: 50,
        limit: 20,
        offset: 0,
        href: "https://api.spotify.com/v1/browse/categories/rock/playlists",
        next: "https://api.spotify.com/v1/browse/categories/rock/playlists?offset=20&limit=20",
        previous: null,
      },
    };

    vi.mocked(mockClient.browse.getPlaylistsForCategory).mockResolvedValueOnce(mockResponse as any);

    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "rock",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.playlists.items).toHaveLength(2);
    expect(response.playlists.items[0]).toEqual({
      id: "playlist1",
      name: "Rock Classics",
      description: "The best rock songs from the 70s and 80s",
      owner: {
        id: "spotify",
        display_name: "Spotify",
      },
      images: [],
      tracks: {
        total: 100,
      },
      public: true,
      collaborative: false,
      external_url: "https://open.spotify.com/playlist/playlist1",
    });

    expect(response.playlists.total).toBe(50);
    expect(response.playlists.limit).toBe(20);
    expect(response.playlists.offset).toBe(0);
    expect(response.playlists.next).toBe(
      "https://api.spotify.com/v1/browse/categories/rock/playlists?offset=20&limit=20",
    );

    expect(mockClient.browse.getPlaylistsForCategory).toHaveBeenCalledWith(
      "rock",
      undefined,
      20,
      0,
    );
  });

  it("should handle country parameter", async () => {
    const mockResponse = {
      playlists: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        href: "https://api.spotify.com/v1/browse/categories/jazz/playlists",
        next: null,
        previous: null,
      },
    };

    vi.mocked(mockClient.browse.getPlaylistsForCategory).mockResolvedValueOnce(mockResponse as any);

    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "jazz",
      country: "JP",
      limit: 10,
    });

    expect(result.isError).not.toBe(true);

    expect(mockClient.browse.getPlaylistsForCategory).toHaveBeenCalledWith("jazz", "JP", 10, 0);
  });

  it("should handle pagination", async () => {
    const mockResponse = {
      playlists: {
        items: [],
        total: 100,
        limit: 5,
        offset: 10,
        href: "https://api.spotify.com/v1/browse/categories/pop/playlists",
        next: "https://api.spotify.com/v1/browse/categories/pop/playlists?offset=15&limit=5",
        previous: "https://api.spotify.com/v1/browse/categories/pop/playlists?offset=5&limit=5",
      },
    };

    vi.mocked(mockClient.browse.getPlaylistsForCategory).mockResolvedValueOnce(mockResponse as any);

    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "pop",
      limit: 5,
      offset: 10,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.playlists.limit).toBe(5);
    expect(response.playlists.offset).toBe(10);
    expect(response.playlists.next).toBe(
      "https://api.spotify.com/v1/browse/categories/pop/playlists?offset=15&limit=5",
    );
  });

  it("should handle empty category ID", async () => {
    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Category ID must not be empty");
  });

  it("should handle invalid limit", async () => {
    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "rock",
      limit: 60,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Limit must be between 1 and 50");
  });

  it("should handle negative offset", async () => {
    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "rock",
      offset: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Offset must be a non-negative number");
  });

  it("should handle invalid country code", async () => {
    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "rock",
      country: "USA", // Should be "US"
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Country must be a valid ISO 3166-1 alpha-2");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.browse.getPlaylistsForCategory).mockRejectedValueOnce(
      new Error("Category not found"),
    );

    const result = await getCategoryPlaylistsTool.handler({
      categoryId: "invalid-category",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get category playlists: Category not found",
    );
  });
});
