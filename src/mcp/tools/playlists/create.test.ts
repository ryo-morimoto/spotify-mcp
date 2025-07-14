import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createCreatePlaylistTool } from "@mcp/tools/playlists/create.ts";

describe("create-playlist", () => {
  const mockClient = {
    currentUser: {
      profile: vi.fn(),
    },
    playlists: {
      createPlaylist: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const createPlaylistTool = createCreatePlaylistTool(mockClient);

  it("should create a playlist with minimal parameters", async () => {
    const mockUser = { id: "testuser123" };
    const mockPlaylist = {
      id: "newplaylist123",
      name: "My New Playlist",
      description: null,
      public: true,
      collaborative: false,
      owner: {
        id: "testuser123",
        display_name: "Test User",
      },
      tracks: {
        total: 0,
      },
      external_urls: {
        spotify: "https://open.spotify.com/playlist/newplaylist123",
      },
      images: [],
    };

    vi.mocked(mockClient.currentUser.profile).mockResolvedValueOnce(mockUser as any);
    vi.mocked(mockClient.playlists.createPlaylist).mockResolvedValueOnce(mockPlaylist as any);

    const result = await createPlaylistTool.handler({
      name: "My New Playlist",
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:playlist:newplaylist123");
    expect(resource.resource.mimeType).toBe("application/json");

    const response = JSON.parse(resource.resource.text);
    expect(response).toEqual({
      id: "newplaylist123",
      name: "My New Playlist",
      description: null,
      public: true,
      collaborative: false,
      owner: "Test User",
      total_tracks: 0,
      external_url: "https://open.spotify.com/playlist/newplaylist123",
    });

    expect(mockClient.currentUser.profile).toHaveBeenCalled();
    expect(mockClient.playlists.createPlaylist).toHaveBeenCalledWith("testuser123", {
      name: "My New Playlist",
      public: true,
      collaborative: false,
      description: undefined,
    });
  });

  it("should create a private playlist", async () => {
    const mockUser = { id: "testuser123" };
    const mockPlaylist = {
      id: "privateplaylist123",
      name: "My Private Playlist",
      description: "This is a private playlist",
      public: false,
      collaborative: false,
      owner: {
        id: "testuser123",
        display_name: "Test User",
      },
      tracks: {
        total: 0,
      },
      external_urls: {
        spotify: "https://open.spotify.com/playlist/privateplaylist123",
      },
      images: [],
    };

    vi.mocked(mockClient.currentUser.profile).mockResolvedValueOnce(mockUser as any);
    vi.mocked(mockClient.playlists.createPlaylist).mockResolvedValueOnce(mockPlaylist as any);

    const result = await createPlaylistTool.handler({
      name: "My Private Playlist",
      public: false,
      description: "This is a private playlist",
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:playlist:privateplaylist123");

    const response = JSON.parse(resource.resource.text);
    expect(response.public).toBe(false);
    expect(response.description).toBe("This is a private playlist");

    expect(mockClient.playlists.createPlaylist).toHaveBeenCalledWith("testuser123", {
      name: "My Private Playlist",
      public: false,
      collaborative: false,
      description: "This is a private playlist",
    });
  });

  it("should create a collaborative playlist", async () => {
    const mockUser = { id: "testuser123" };
    const mockPlaylist = {
      id: "collabplaylist123",
      name: "Collaborative Playlist",
      description: null,
      public: false,
      collaborative: true,
      owner: {
        id: "testuser123",
        display_name: "Test User",
      },
      tracks: {
        total: 0,
      },
      external_urls: {
        spotify: "https://open.spotify.com/playlist/collabplaylist123",
      },
      images: [],
    };

    vi.mocked(mockClient.currentUser.profile).mockResolvedValueOnce(mockUser as any);
    vi.mocked(mockClient.playlists.createPlaylist).mockResolvedValueOnce(mockPlaylist as any);

    const result = await createPlaylistTool.handler({
      name: "Collaborative Playlist",
      collaborative: true,
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:playlist:collabplaylist123");

    const response = JSON.parse(resource.resource.text);
    expect(response.collaborative).toBe(true);
    expect(response.public).toBe(false); // Collaborative playlists are always private

    expect(mockClient.playlists.createPlaylist).toHaveBeenCalledWith("testuser123", {
      name: "Collaborative Playlist",
      public: false, // Should be forced to false when collaborative
      collaborative: true,
      description: undefined,
    });
  });

  it("should handle empty playlist name", async () => {
    const result = await createPlaylistTool.handler({
      name: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist name must not be empty");
  });

  it("should handle whitespace-only playlist name", async () => {
    const result = await createPlaylistTool.handler({
      name: "   ",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist name must not be empty");
  });

  it("should handle user profile fetch error", async () => {
    vi.mocked(mockClient.currentUser.profile).mockRejectedValueOnce(
      new Error("Failed to get user profile"),
    );

    const result = await createPlaylistTool.handler({
      name: "Test Playlist",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to create playlist: Failed to get user profile",
    );
  });

  it("should handle playlist creation error", async () => {
    const mockUser = { id: "testuser123" };
    vi.mocked(mockClient.currentUser.profile).mockResolvedValueOnce(mockUser as any);
    vi.mocked(mockClient.playlists.createPlaylist).mockRejectedValueOnce(new Error("API Error"));

    const result = await createPlaylistTool.handler({
      name: "Test Playlist",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Failed to create playlist: API Error");
  });
});
