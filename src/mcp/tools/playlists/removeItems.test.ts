import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createRemovePlaylistItemsTool } from "@mcp/tools/playlists/removeItems.ts";

describe("remove-playlist-items", () => {
  const mockClient = {
    playlists: {
      removeItemsFromPlaylist: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const removePlaylistItemsTool = createRemovePlaylistItemsTool(mockClient);

  it("should remove a single track from playlist", async () => {
    vi.mocked(mockClient.playlists.removeItemsFromPlaylist).mockResolvedValueOnce(undefined as any);

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response).toEqual({
      snapshot_id: "not-available-due-to-sdk-limitation",
      items_removed: 1,
    });

    expect(mockClient.playlists.removeItemsFromPlaylist).toHaveBeenCalledWith("test-playlist-id", {
      tracks: [{ uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" }],
      snapshot_id: undefined,
    });
  });

  it("should remove multiple tracks from playlist", async () => {
    vi.mocked(mockClient.playlists.removeItemsFromPlaylist).mockResolvedValueOnce(undefined as any);

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: [
        "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
        "spotify:track:1301WleyT98MSxVHPZCA6M",
        "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
      ],
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.items_removed).toBe(3);

    expect(mockClient.playlists.removeItemsFromPlaylist).toHaveBeenCalledWith("test-playlist-id", {
      tracks: [
        { uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" },
        { uri: "spotify:track:1301WleyT98MSxVHPZCA6M" },
        { uri: "spotify:episode:512ojhOuo1ktJprKbVcKyQ" },
      ],
      snapshot_id: undefined,
    });
  });

  it("should remove specific occurrences with positions", async () => {
    vi.mocked(mockClient.playlists.removeItemsFromPlaylist).mockResolvedValueOnce(undefined as any);

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      tracks: [
        { uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh", positions: [0, 7, 12] },
        { uri: "spotify:track:1301WleyT98MSxVHPZCA6M", positions: [2] },
      ],
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.items_removed).toBe(2);

    expect(mockClient.playlists.removeItemsFromPlaylist).toHaveBeenCalledWith("test-playlist-id", {
      tracks: [
        { uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh", positions: [0, 7, 12] },
        { uri: "spotify:track:1301WleyT98MSxVHPZCA6M", positions: [2] },
      ],
      snapshot_id: undefined,
    });
  });

  it("should use snapshot ID for concurrent safety", async () => {
    vi.mocked(mockClient.playlists.removeItemsFromPlaylist).mockResolvedValueOnce(undefined as any);

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      snapshot_id: "current-snapshot-123",
    });

    expect(result.isError).not.toBe(true);

    expect(mockClient.playlists.removeItemsFromPlaylist).toHaveBeenCalledWith("test-playlist-id", {
      tracks: [{ uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" }],
      snapshot_id: "current-snapshot-123",
    });
  });

  it("should handle empty playlist ID", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should require either uris or tracks", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Either uris or tracks must be provided");
  });

  it("should handle both uris and tracks provided", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      tracks: [{ uri: "spotify:track:1301WleyT98MSxVHPZCA6M", positions: [0] }],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Cannot provide both uris and tracks parameters",
    );
  });

  it("should validate URI format", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["invalid-uri-format"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Invalid URI format");
  });

  it("should validate supported URI types", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:album:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Only track and episode URIs are supported");
  });

  it("should validate negative positions", async () => {
    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      tracks: [{ uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh", positions: [-1] }],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("All positions must be non-negative");
  });

  it("should handle too many items", async () => {
    const tooManyUris = Array(101).fill("spotify:track:4iV5W9uYEdYUVa79Axb7Rh");

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: tooManyUris,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Cannot remove more than 100 items at once");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.removeItemsFromPlaylist).mockRejectedValueOnce(
      new Error("Playlist not found"),
    );

    const result = await removePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to remove items from playlist: Playlist not found",
    );
  });
});
