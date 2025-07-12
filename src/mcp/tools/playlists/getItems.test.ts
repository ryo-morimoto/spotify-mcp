import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetPlaylistItemsTool } from "./getItems.ts";

describe("get-playlist-items", () => {
  const mockClient = {
    playlists: {
      getPlaylistItems: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const getPlaylistItemsTool = createGetPlaylistItemsTool(mockClient);

  it("should get items from a playlist", async () => {
    const playlistId = "test-playlist-id";
    const mockResponse = {
      items: [
        {
          track: {
            id: "track1",
            name: "Test Track 1",
            type: "track",
            artists: [{ id: "artist1", name: "Test Artist" }],
            album: {
              id: "album1",
              name: "Test Album",
              release_date: "2023-01-01",
            },
            duration_ms: 180000,
            explicit: false,
            external_urls: {
              spotify: "https://open.spotify.com/track/track1",
            },
          },
          added_at: "2023-01-01T00:00:00Z",
          added_by: { id: "user1" },
        },
        {
          track: {
            id: "track2",
            name: "Test Track 2",
            type: "track",
            artists: [{ id: "artist2", name: "Test Artist 2" }],
            album: {
              id: "album2",
              name: "Test Album 2",
              release_date: "2023-02-01",
            },
            duration_ms: 240000,
            explicit: true,
            external_urls: {
              spotify: "https://open.spotify.com/track/track2",
            },
          },
          added_at: "2023-02-01T00:00:00Z",
          added_by: null,
        },
      ],
    };

    vi.mocked(mockClient.playlists.getPlaylistItems).mockResolvedValueOnce(mockResponse as any);

    const result = await getPlaylistItemsTool.handler({
      playlistId,
      limit: 10,
    });

    expect(result.isError).not.toBe(true);

    const items = JSON.parse((result.content[0] as any).text);
    expect(items).toHaveLength(2);

    expect(items[0]).toEqual({
      track: {
        id: "track1",
        name: "Test Track 1",
        artists: [{ id: "artist1", name: "Test Artist" }],
        album: {
          id: "album1",
          name: "Test Album",
          release_date: "2023-01-01",
        },
        duration_ms: 180000,
        explicit: false,
        external_url: "https://open.spotify.com/track/track1",
      },
      added_at: "2023-01-01T00:00:00Z",
      added_by: "user1",
    });

    expect(items[1].added_by).toBe("spotify");

    expect(mockClient.playlists.getPlaylistItems).toHaveBeenCalledWith(
      playlistId,
      undefined,
      undefined,
      10,
      undefined,
    );
  });

  it("should handle pagination with offset", async () => {
    const playlistId = "test-playlist-id";
    const mockResponse = {
      items: [
        {
          track: {
            id: "track3",
            name: "Test Track 3",
            type: "track",
            artists: [{ id: "artist3", name: "Test Artist 3" }],
            album: {
              id: "album3",
              name: "Test Album 3",
              release_date: "2023-03-01",
            },
            duration_ms: 200000,
            explicit: false,
            external_urls: {
              spotify: "https://open.spotify.com/track/track3",
            },
          },
          added_at: "2023-03-01T00:00:00Z",
          added_by: { id: "user2" },
        },
      ],
    };

    vi.mocked(mockClient.playlists.getPlaylistItems).mockResolvedValueOnce(mockResponse as any);

    const result = await getPlaylistItemsTool.handler({
      playlistId,
      limit: 5,
      offset: 10,
    });

    expect(result.isError).not.toBe(true);

    expect(mockClient.playlists.getPlaylistItems).toHaveBeenCalledWith(
      playlistId,
      undefined,
      undefined,
      5,
      10,
    );
  });

  it("should filter by market", async () => {
    const playlistId = "test-playlist-id";
    const mockResponse = {
      items: [
        {
          track: {
            id: "track4",
            name: "Test Track 4",
            type: "track",
            artists: [{ id: "artist4", name: "Test Artist 4" }],
            album: {
              id: "album4",
              name: "Test Album 4",
              release_date: "2023-04-01",
            },
            duration_ms: 150000,
            explicit: false,
            external_urls: {
              spotify: "https://open.spotify.com/track/track4",
            },
          },
          added_at: "2023-04-01T00:00:00Z",
          added_by: { id: "user3" },
        },
      ],
    };

    vi.mocked(mockClient.playlists.getPlaylistItems).mockResolvedValueOnce(mockResponse as any);

    const result = await getPlaylistItemsTool.handler({
      playlistId,
      market: "US",
      limit: 1,
    });

    expect(result.isError).not.toBe(true);

    expect(mockClient.playlists.getPlaylistItems).toHaveBeenCalledWith(
      playlistId,
      "US",
      undefined,
      1,
      undefined,
    );
  });

  it("should handle empty playlist ID", async () => {
    const result = await getPlaylistItemsTool.handler({
      playlistId: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should handle invalid playlist ID", async () => {
    const errorMessage = "Invalid playlist ID";
    vi.mocked(mockClient.playlists.getPlaylistItems).mockRejectedValueOnce(new Error(errorMessage));

    const result = await getPlaylistItemsTool.handler({
      playlistId: "invalid_playlist_id",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get playlist items: Invalid playlist ID",
    );
  });

  it("should filter out non-track items", async () => {
    const mockResponse = {
      items: [
        {
          track: {
            id: "track5",
            name: "Test Track 5",
            type: "track",
            artists: [{ id: "artist5", name: "Test Artist 5" }],
            album: {
              id: "album5",
              name: "Test Album 5",
              release_date: "2023-05-01",
            },
            duration_ms: 300000,
            explicit: true,
            external_urls: {
              spotify: "https://open.spotify.com/track/track5",
            },
          },
          added_at: "2023-05-01T00:00:00Z",
          added_by: { id: "user5" },
        },
        {
          track: null, // Episode or deleted track
          added_at: "2023-05-02T00:00:00Z",
          added_by: { id: "user6" },
        },
        {
          track: {
            id: "episode1",
            name: "Test Episode",
            type: "episode", // Not a track
            external_urls: {
              spotify: "https://open.spotify.com/episode/episode1",
            },
          },
          added_at: "2023-05-03T00:00:00Z",
          added_by: { id: "user7" },
        },
      ],
    };

    vi.mocked(mockClient.playlists.getPlaylistItems).mockResolvedValueOnce(mockResponse as any);

    const result = await getPlaylistItemsTool.handler({
      playlistId: "test-playlist",
    });

    expect(result.isError).not.toBe(true);

    const items = JSON.parse((result.content[0] as any).text);
    expect(items).toHaveLength(1); // Only the track should be included
    expect(items[0].track.id).toBe("track5");
  });
});
