import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getSavedAlbums, createGetSavedAlbumsTool } from "./getSaved.ts";

describe("getSavedAlbums", () => {
  const mockClient = {
    currentUser: {
      albums: {
        savedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should fetch saved albums with default parameters", async () => {
    const mockSavedAlbums = {
      href: "https://api.spotify.com/v1/me/albums",
      items: [
        {
          added_at: "2024-01-01T00:00:00Z",
          album: {
            id: "album1",
            name: "Test Album",
            artists: [{ id: "artist1", name: "Test Artist" }],
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
            release_date: "2023-01-01",
            total_tracks: 10,
            uri: "spotify:album:album1",
          },
        },
      ],
      limit: 20,
      next: null,
      offset: 0,
      previous: null,
      total: 1,
    };

    vi.mocked(mockClient.currentUser.albums.savedAlbums).mockResolvedValue(mockSavedAlbums as any);

    const result = await getSavedAlbums(mockClient);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockSavedAlbums);
    }
  });

  it("should respect limit parameter", async () => {
    const mockSavedAlbums = {
      items: [],
      limit: 10,
      offset: 0,
      total: 0,
      href: "",
      next: null,
      previous: null,
    };
    vi.mocked(mockClient.currentUser.albums.savedAlbums).mockResolvedValue(mockSavedAlbums as any);

    const result = await getSavedAlbums(mockClient, { limit: 10 });
    expect(result.isOk()).toBe(true);
    expect(mockClient.currentUser.albums.savedAlbums).toHaveBeenCalledWith(
      10,
      undefined,
      undefined,
    );
  });

  it("should handle offset parameter", async () => {
    const mockSavedAlbums = {
      items: [],
      limit: 20,
      offset: 5,
      total: 0,
      href: "",
      next: null,
      previous: null,
    };
    vi.mocked(mockClient.currentUser.albums.savedAlbums).mockResolvedValue(mockSavedAlbums as any);

    const result = await getSavedAlbums(mockClient, { offset: 5 });
    expect(result.isOk()).toBe(true);
    expect(mockClient.currentUser.albums.savedAlbums).toHaveBeenCalledWith(undefined, 5, undefined);
  });

  it("should validate limit parameter", async () => {
    const result = await getSavedAlbums(mockClient, { limit: 51 });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Limit must be between 1 and 50");
    }
  });

  it("should validate offset parameter", async () => {
    const result = await getSavedAlbums(mockClient, { offset: -1 });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Offset must be non-negative");
    }
  });

  it("should validate market parameter format", async () => {
    const result = await getSavedAlbums(mockClient, { market: "USA" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.savedAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await getSavedAlbums(mockClient);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to get saved albums: API request failed");
    }
  });
});

describe("createGetSavedAlbumsTool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        savedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createGetSavedAlbumsTool(mockClient);
    expect(tool.name).toBe("get_saved_albums");
    expect(tool.title).toBe("Get User's Saved Albums");
    expect(tool.description).toContain("saved in the current Spotify user's library");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful API response", async () => {
    const mockSavedAlbums = {
      items: [{ added_at: "2024-01-01", album: { id: "1", name: "Album" } }],
      limit: 5,
      offset: 0,
      total: 1,
      href: "",
      next: null,
      previous: null,
    };
    vi.mocked(mockClient.currentUser.albums.savedAlbums).mockResolvedValue(mockSavedAlbums as any);

    const tool = createGetSavedAlbumsTool(mockClient);
    const result = await tool.handler({ limit: 5 });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockSavedAlbums);
  });

  it("should handle API errors", async () => {
    const tool = createGetSavedAlbumsTool(mockClient);
    const result = await tool.handler({ limit: 100 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
