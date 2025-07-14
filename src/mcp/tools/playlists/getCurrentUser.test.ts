import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetCurrentUserPlaylistsTool } from "@mcp/tools/playlists/getCurrentUser.ts";

describe("get-current-user-playlists", () => {
  const mockClient = {
    currentUser: {
      playlists: {
        playlists: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  const getCurrentUserPlaylistsTool = createGetCurrentUserPlaylistsTool(mockClient);

  it("should get current user playlists with default parameters", async () => {
    const mockResponse = {
      items: [
        {
          id: "playlist1",
          name: "My Playlist 1",
          description: "Description 1",
          public: true,
          collaborative: false,
          owner: { id: "user123", display_name: "Test User" },
          tracks: { total: 10 },
          external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
        },
        {
          id: "playlist2",
          name: "My Playlist 2",
          description: null,
          public: false,
          collaborative: true,
          owner: { id: "user123", display_name: "Test User" },
          tracks: { total: 25 },
          external_urls: { spotify: "https://open.spotify.com/playlist/playlist2" },
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
      href: "https://api.spotify.com/v1/me/playlists",
      next: null,
      previous: null,
    };

    vi.mocked(mockClient.currentUser.playlists.playlists).mockResolvedValueOnce(
      mockResponse as any,
    );

    const result = await getCurrentUserPlaylistsTool.handler({});

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      id: "playlist1",
      name: "My Playlist 1",
      description: "Description 1",
      owner: {
        id: "user123",
        display_name: "Test User",
      },
      images: [],
      tracks: {
        total: 10,
      },
      public: true,
      collaborative: false,
      external_url: "https://open.spotify.com/playlist/playlist1",
    });

    expect(response.total).toBe(2);
    expect(response.limit).toBe(20);
    expect(response.offset).toBe(0);
    expect(response.next).toBe(null);

    expect(mockClient.currentUser.playlists.playlists).toHaveBeenCalledWith(20, 0);
  });

  it("should handle pagination parameters", async () => {
    const mockResponse = {
      items: [],
      total: 100,
      limit: 5,
      offset: 20,
      href: "https://api.spotify.com/v1/me/playlists",
      next: "https://api.spotify.com/v1/me/playlists?offset=25&limit=5",
      previous: "https://api.spotify.com/v1/me/playlists?offset=15&limit=5",
    };

    vi.mocked(mockClient.currentUser.playlists.playlists).mockResolvedValueOnce(
      mockResponse as any,
    );

    const result = await getCurrentUserPlaylistsTool.handler({
      limit: 5,
      offset: 20,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.limit).toBe(5);
    expect(response.offset).toBe(20);
    expect(response.next).toBe("https://api.spotify.com/v1/me/playlists?offset=25&limit=5");

    expect(mockClient.currentUser.playlists.playlists).toHaveBeenCalledWith(5, 20);
  });

  it("should handle invalid limit", async () => {
    const result = await getCurrentUserPlaylistsTool.handler({
      limit: 60,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Limit must be between 1 and 50");
  });

  it("should handle negative offset", async () => {
    const result = await getCurrentUserPlaylistsTool.handler({
      offset: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Offset must be a non-negative number");
  });

  it("should handle empty playlists", async () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
      href: "https://api.spotify.com/v1/me/playlists",
      next: null,
      previous: null,
    };

    vi.mocked(mockClient.currentUser.playlists.playlists).mockResolvedValueOnce(
      mockResponse as any,
    );

    const result = await getCurrentUserPlaylistsTool.handler({});

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.items).toHaveLength(0);
    expect(response.total).toBe(0);
    expect(response.next).toBe(null);
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.currentUser.playlists.playlists).mockRejectedValueOnce(
      new Error("Authentication failed"),
    );

    const result = await getCurrentUserPlaylistsTool.handler({});

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get current user playlists: Authentication failed",
    );
  });
});
