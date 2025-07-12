import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi, Album } from "@spotify/web-api-ts-sdk";
import { getSeveralAlbums } from "./getSeveralAlbums.ts";

describe("getSeveralAlbums", () => {
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

    const result = await getSeveralAlbums(mockClient, ["album1", "album2"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("album1");
      expect(result.value[0].name).toBe("Album One");
      expect(result.value[0].artists).toBe("Artist 1");
      expect(result.value[1].id).toBe("album2");
      expect(result.value[1].name).toBe("Album Two");
      expect(result.value[1].artists).toBe("Artist 2");
    }
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

    const result = await getSeveralAlbums(mockClient, ["album1"], "US");

    expect(result.isOk()).toBe(true);
    expect(mockClient.albums.get).toHaveBeenCalledWith(["album1"], "US");
  });

  it("should return error for empty album IDs array", async () => {
    const result = await getSeveralAlbums(mockClient, []);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Album IDs must not be empty");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for too many album IDs", async () => {
    const tooManyIds = Array.from({ length: 21 }, (_, i) => `album${i}`);
    const result = await getSeveralAlbums(mockClient, tooManyIds);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 20 album IDs allowed");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid album ID", async () => {
    const result = await getSeveralAlbums(mockClient, ["valid", "", "also_valid"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("All album IDs must be non-empty strings");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should return error for invalid market code", async () => {
    const result = await getSeveralAlbums(mockClient, ["album1"], "USA");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.albums.get).mockRejectedValue(new Error("API Error"));

    const result = await getSeveralAlbums(mockClient, ["album1"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get albums: API Error");
    }
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

    const result = await getSeveralAlbums(mockClient, ["album1"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].artists).toBe("Artist 1, Artist 2, Artist 3");
    }
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

    const result = await getSeveralAlbums(mockClient, ["album1"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].images).toEqual([]);
    }
  });
});
