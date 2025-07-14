import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createChangePlaylistDetailsTool } from "@mcp/tools/playlists/changeDetails.ts";

describe("change-playlist-details", () => {
  const mockClient = {
    playlists: {
      changePlaylistDetails: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const changePlaylistDetailsTool = createChangePlaylistDetailsTool(mockClient);

  it("should update playlist name", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      name: "Updated Playlist Name",
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: "Updated Playlist Name",
      public: undefined,
      collaborative: undefined,
      description: undefined,
    });
  });

  it("should update playlist description", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      description: "This is an updated description",
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: undefined,
      public: undefined,
      collaborative: undefined,
      description: "This is an updated description",
    });
  });

  it("should update playlist visibility", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      public: false,
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: undefined,
      public: false,
      collaborative: undefined,
      description: undefined,
    });
  });

  it("should update collaborative status", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      collaborative: true,
      public: false, // Collaborative playlists must be private
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: undefined,
      public: false,
      collaborative: true,
      description: undefined,
    });
  });

  it("should update all fields at once", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      name: "Completely Updated Playlist",
      description: "New description for the playlist",
      public: true,
      collaborative: false,
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: "Completely Updated Playlist",
      public: true,
      collaborative: false,
      description: "New description for the playlist",
    });
  });

  it("should clear description when empty string provided", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockResolvedValueOnce(undefined);

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      description: "",
    });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as any).text).toBe("Playlist details updated successfully");

    expect(mockClient.playlists.changePlaylistDetails).toHaveBeenCalledWith("test-playlist-id", {
      name: undefined,
      public: undefined,
      collaborative: undefined,
      description: "",
    });
  });

  it("should handle empty playlist ID", async () => {
    const result = await changePlaylistDetailsTool.handler({
      playlistId: "",
      name: "Test",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should handle empty update (no fields provided)", async () => {
    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "At least one field must be provided to update",
    );
  });

  it("should reject collaborative playlist without setting it private", async () => {
    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      collaborative: true,
      public: true, // This should be rejected
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Collaborative playlists must be private");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.changePlaylistDetails).mockRejectedValueOnce(
      new Error("Playlist not found"),
    );

    const result = await changePlaylistDetailsTool.handler({
      playlistId: "test-playlist-id",
      name: "Test",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to update playlist details: Playlist not found",
    );
  });
});
