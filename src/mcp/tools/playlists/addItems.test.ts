import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createAddItemsToPlaylistTool } from "./addItems.ts";

describe("add-items-to-playlist", () => {
  const mockClient = {
    playlists: {
      addItemsToPlaylist: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const addItemsToPlaylistTool = createAddItemsToPlaylistTool(mockClient);

  it("should add a single track to playlist", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-123" };
    vi.mocked(mockClient.playlists.addItemsToPlaylist).mockResolvedValueOnce(mockSnapshot as any);

    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response).toEqual({
      snapshot_id: "not-available-due-to-sdk-limitation",
      items_added: 1,
    });

    expect(mockClient.playlists.addItemsToPlaylist).toHaveBeenCalledWith(
      "test-playlist-id",
      ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      undefined,
    );
  });

  it("should add multiple tracks to playlist", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-456" };
    vi.mocked(mockClient.playlists.addItemsToPlaylist).mockResolvedValueOnce(mockSnapshot as any);

    const result = await addItemsToPlaylistTool.handler({
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
      snapshot_id: "not-available-due-to-sdk-limitation",
      items_added: 3,
    });
  });

  it("should add items at specific position", async () => {
    const mockSnapshot = { snapshot_id: "new-snapshot-789" };
    vi.mocked(mockClient.playlists.addItemsToPlaylist).mockResolvedValueOnce(mockSnapshot as any);

    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      position: 5,
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.snapshot_id).toBe("not-available-due-to-sdk-limitation");

    expect(mockClient.playlists.addItemsToPlaylist).toHaveBeenCalledWith(
      "test-playlist-id",
      ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      5,
    );
  });

  it("should handle empty playlist ID", async () => {
    const result = await addItemsToPlaylistTool.handler({
      playlistId: "",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should handle empty URIs array", async () => {
    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: [],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("At least one URI must be provided");
  });

  it("should validate URI format", async () => {
    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["invalid-uri-format"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Invalid URI format");
  });

  it("should validate supported URI types", async () => {
    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:album:4iV5W9uYEdYUVa79Axb7Rh"], // album URI not supported
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Only track and episode URIs are supported");
  });

  it("should handle too many items", async () => {
    const tooManyUris = Array(101).fill("spotify:track:4iV5W9uYEdYUVa79Axb7Rh");

    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: tooManyUris,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Cannot add more than 100 items at once");
  });

  it("should handle negative position", async () => {
    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
      position: -1,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Position must be a non-negative number");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.addItemsToPlaylist).mockRejectedValueOnce(
      new Error("Playlist not found"),
    );

    const result = await addItemsToPlaylistTool.handler({
      playlistId: "test-playlist-id",
      uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to add items to playlist: Playlist not found",
    );
  });
});
