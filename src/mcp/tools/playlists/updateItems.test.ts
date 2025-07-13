import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createUpdatePlaylistItemsTool } from "./updateItems.ts";

describe("update-playlist-items", () => {
  const mockClient = {
    playlists: {
      updatePlaylistItems: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const updatePlaylistItemsTool = createUpdatePlaylistItemsTool(mockClient);

  it("should update playlist items with URIs only", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-123" };
    vi.mocked(mockClient.playlists.updatePlaylistItems).mockResolvedValueOnce(mockSnapshot as any);

    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: [
        "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
        "spotify:track:1301WleyT98MSxVHPZCA6M",
        "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
      ],
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response).toEqual({
      snapshot_id: "new-snapshot-123",
    });

    expect(mockClient.playlists.updatePlaylistItems).toHaveBeenCalledWith("test-playlist-id", {
      uris: [
        "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
        "spotify:track:1301WleyT98MSxVHPZCA6M",
        "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
      ],
      range_start: undefined,
      insert_before: undefined,
      range_length: undefined,
      snapshot_id: undefined,
    });
  });

  it("should reorder items with range parameters", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-456" };
    vi.mocked(mockClient.playlists.updatePlaylistItems).mockResolvedValueOnce(mockSnapshot as any);

    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      range_start: 1,
      insert_before: 3,
      range_length: 2,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.snapshot_id).toBe("new-snapshot-456");

    expect(mockClient.playlists.updatePlaylistItems).toHaveBeenCalledWith("test-playlist-id", {
      uris: undefined,
      range_start: 1,
      insert_before: 3,
      range_length: 2,
      snapshot_id: undefined,
    });
  });

  it("should use snapshot ID for concurrent safety", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-789" };
    vi.mocked(mockClient.playlists.updatePlaylistItems).mockResolvedValueOnce(mockSnapshot as any);

    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      snapshot_id: "current-snapshot-123",
    });

    expect(result.isError).not.toBe(true);

    expect(mockClient.playlists.updatePlaylistItems).toHaveBeenCalledWith("test-playlist-id", {
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      range_start: undefined,
      insert_before: undefined,
      range_length: undefined,
      snapshot_id: "current-snapshot-123",
    });
  });

  it("should handle empty playlist ID", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should require either URIs or range parameters", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Either uris or range parameters must be provided",
    );
  });

  it("should validate URI format", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["invalid-uri-format"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Invalid URI format");
  });

  it("should validate supported URI types", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:album:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Only track and episode URIs are supported");
  });

  it("should validate range_start is non-negative", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      range_start: -1,
      insert_before: 0,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("range_start must be a non-negative number");
  });

  it("should validate insert_before is non-negative", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      range_start: 0,
      insert_before: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "insert_before must be a non-negative number",
    );
  });

  it("should validate range_length is positive", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      range_start: 0,
      insert_before: 1,
      range_length: 0,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("range_length must be a positive number");
  });

  it("should require both range_start and insert_before for reordering", async () => {
    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      range_start: 0,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Both range_start and insert_before are required for reordering",
    );
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.updatePlaylistItems).mockRejectedValueOnce(
      new Error("Playlist not found"),
    );

    const result = await updatePlaylistItemsTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to update playlist items: Playlist not found",
    );
  });
});
