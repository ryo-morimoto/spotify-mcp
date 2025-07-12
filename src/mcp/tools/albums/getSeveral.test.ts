import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Album } from "@spotify/web-api-ts-sdk";
import { createGetSeveralAlbumsTool } from "./getSeveral.ts";

describe("get-several-albums tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      albums: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should get multiple albums successfully", async () => {
    const mockAlbums: Album[] = [
      {
        id: "album1",
        name: "Album One",
        artists: [{ name: "Artist 1", id: "artist1", type: "artist" }],
        release_date: "2023-01-01",
        total_tracks: 10,
        album_type: "album",
        external_urls: { spotify: "https://spotify.com/album1" },
        images: [{ url: "https://image1.jpg", height: 300, width: 300 }],
        type: "album",
        uri: "spotify:album:album1",
        href: "https://api.spotify.com/v1/albums/album1",
      } as Album,
      {
        id: "album2",
        name: "Album Two",
        artists: [{ name: "Artist 2", id: "artist2", type: "artist" }],
        release_date: "2023-02-01",
        total_tracks: 12,
        album_type: "album",
        external_urls: { spotify: "https://spotify.com/album2" },
        images: [{ url: "https://image2.jpg", height: 300, width: 300 }],
        type: "album",
        uri: "spotify:album:album2",
        href: "https://api.spotify.com/v1/albums/album2",
      } as Album,
    ];

    vi.mocked(mockClient.albums.get).mockResolvedValue(mockAlbums);

    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1", "album2"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const albums = JSON.parse((result.content[0] as any).text);
    expect(albums).toHaveLength(2);
    expect(albums[0].id).toBe("album1");
    expect(albums[0].name).toBe("Album One");
    expect(albums[0].artists).toBe("Artist 1");
    expect(albums[1].id).toBe("album2");
    expect(albums[1].name).toBe("Album Two");
    expect(albums[1].artists).toBe("Artist 2");
    expect(mockClient.albums.get).toHaveBeenCalledWith(["album1", "album2"], undefined);
  });

  it("should handle market parameter", async () => {
    const mockAlbum: Album = {
      id: "album1",
      name: "Album One",
      artists: [{ name: "Artist 1", id: "artist1", type: "artist" }],
      release_date: "2023-01-01",
      total_tracks: 10,
      album_type: "album",
      external_urls: { spotify: "https://spotify.com/album1" },
      images: [],
      type: "album",
      uri: "spotify:album:album1",
      href: "https://api.spotify.com/v1/albums/album1",
    } as unknown as Album;

    vi.mocked(mockClient.albums.get).mockResolvedValue([mockAlbum]);

    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1"], market: "US" });

    expect(result.isError).toBeFalsy();
    expect(mockClient.albums.get).toHaveBeenCalledWith(["album1"], "US");
  });

  it("should return error for empty album IDs array", async () => {
    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Album IDs must not be empty");
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for too many album IDs", async () => {
    const tooManyIds = Array.from({ length: 21 }, (_, i) => `album${i}`);
    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: tooManyIds });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 20 album IDs allowed");
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid album ID", async () => {
    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["valid", "", "also_valid"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: All album IDs must be non-empty strings");
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1"], market: "USA" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.albums.get).mockRejectedValue(new Error("API Error"));

    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to get albums: API Error");
  });

  it("should handle albums with multiple artists", async () => {
    const mockAlbum: Album = {
      id: "album1",
      name: "Collaboration Album",
      artists: [
        { name: "Artist 1", id: "artist1", type: "artist" },
        { name: "Artist 2", id: "artist2", type: "artist" },
        { name: "Artist 3", id: "artist3", type: "artist" },
      ],
      release_date: "2023-01-01",
      total_tracks: 10,
      album_type: "album",
      external_urls: { spotify: "https://spotify.com/album1" },
      images: [],
      type: "album",
      uri: "spotify:album:album1",
      href: "https://api.spotify.com/v1/albums/album1",
    } as unknown as Album;

    vi.mocked(mockClient.albums.get).mockResolvedValue([mockAlbum]);

    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1"] });

    expect(result.isError).toBeFalsy();
    const albums = JSON.parse((result.content[0] as any).text);
    expect(albums[0].artists).toBe("Artist 1, Artist 2, Artist 3");
  });

  it("should handle albums without images", async () => {
    const mockAlbum: Album = {
      id: "album1",
      name: "Album Without Images",
      artists: [{ name: "Artist 1", id: "artist1", type: "artist" }],
      release_date: "2023-01-01",
      total_tracks: 10,
      album_type: "album",
      external_urls: { spotify: "https://spotify.com/album1" },
      images: [],
      type: "album",
      uri: "spotify:album:album1",
      href: "https://api.spotify.com/v1/albums/album1",
    } as unknown as Album;

    vi.mocked(mockClient.albums.get).mockResolvedValue([mockAlbum]);

    const tool = createGetSeveralAlbumsTool(mockClient);
    const result = await tool.handler({ albumIds: ["album1"] });

    expect(result.isError).toBeFalsy();
    const albums = JSON.parse((result.content[0] as any).text);
    expect(albums[0].images).toEqual([]);
  });
});
