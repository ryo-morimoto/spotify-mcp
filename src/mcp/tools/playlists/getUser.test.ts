import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetUserPlaylistsTool } from "./getUser.ts";

describe("get-user-playlists", () => {
  const mockClient = {
    playlists: {
      getUsersPlaylists: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const getUserPlaylistsTool = createGetUserPlaylistsTool(mockClient);

  it("should get user playlists with default parameters", async () => {
    const mockResponse = {
      items: [
        {
          id: "playlist1",
          name: "User Playlist 1",
          description: "Description 1",
          public: true,
          collaborative: false,
          owner: { id: "targetuser123", display_name: "Target User" },
          tracks: { total: 15 },
          external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
        },
        {
          id: "playlist2",
          name: "User Playlist 2",
          description: null,
          public: false,
          collaborative: false,
          owner: { id: "targetuser123", display_name: "Target User" },
          tracks: { total: 30 },
          external_urls: { spotify: "https://open.spotify.com/playlist/playlist2" },
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
      href: "https://api.spotify.com/v1/users/targetuser123/playlists",
      next: null,
      previous: null,
    };

    vi.mocked(mockClient.playlists.getUsersPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getUserPlaylistsTool.handler({
      userId: "targetuser123",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.playlists).toHaveLength(2);
    expect(response.playlists[0]).toEqual({
      id: "playlist1",
      name: "User Playlist 1",
      description: "Description 1",
      public: true,
      collaborative: false,
      owner: "Target User",
      total_tracks: 15,
      external_url: "https://open.spotify.com/playlist/playlist1",
    });

    expect(response.total).toBe(2);
    expect(response.limit).toBe(20);
    expect(response.offset).toBe(0);
    expect(response.has_more).toBe(false);

    expect(mockClient.playlists.getUsersPlaylists).toHaveBeenCalledWith("targetuser123", 20, 0);
  });

  it("should handle pagination parameters", async () => {
    const mockResponse = {
      items: [],
      total: 150,
      limit: 10,
      offset: 30,
      href: "https://api.spotify.com/v1/users/targetuser123/playlists",
      next: "https://api.spotify.com/v1/users/targetuser123/playlists?offset=40&limit=10",
      previous: "https://api.spotify.com/v1/users/targetuser123/playlists?offset=20&limit=10",
    };

    vi.mocked(mockClient.playlists.getUsersPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getUserPlaylistsTool.handler({
      userId: "targetuser123",
      limit: 10,
      offset: 30,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.limit).toBe(10);
    expect(response.offset).toBe(30);
    expect(response.has_more).toBe(true);

    expect(mockClient.playlists.getUsersPlaylists).toHaveBeenCalledWith("targetuser123", 10, 30);
  });

  it("should handle empty user ID", async () => {
    const result = await getUserPlaylistsTool.handler({
      userId: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("User ID must not be empty");
  });

  it("should handle invalid limit", async () => {
    const result = await getUserPlaylistsTool.handler({
      userId: "targetuser123",
      limit: 60,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Limit must be between 1 and 50");
  });

  it("should handle negative offset", async () => {
    const result = await getUserPlaylistsTool.handler({
      userId: "targetuser123",
      offset: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Offset must be a non-negative number");
  });

  it("should handle playlists with null tracks property", async () => {
    const mockResponse = {
      items: [
        {
          id: "playlist1",
          name: "Playlist with null tracks",
          description: null,
          public: true,
          collaborative: false,
          owner: { id: "user123", display_name: "User" },
          tracks: null,
          external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      href: "https://api.spotify.com/v1/users/user123/playlists",
      next: null,
      previous: null,
    };

    vi.mocked(mockClient.playlists.getUsersPlaylists).mockResolvedValueOnce(mockResponse as any);

    const result = await getUserPlaylistsTool.handler({
      userId: "user123",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.playlists[0].total_tracks).toBe(0);
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.getUsersPlaylists).mockRejectedValueOnce(
      new Error("User not found"),
    );

    const result = await getUserPlaylistsTool.handler({
      userId: "nonexistentuser",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get user playlists: User not found",
    );
  });
});
