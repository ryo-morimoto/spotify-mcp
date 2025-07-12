import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getAlbum } from "./get.ts";

describe("getAlbum", () => {
  const mockAlbum = {
    id: "6TJmQnO44YE5BtTxH8pop1",
    name: "Hot Fuss",
    artists: [
      {
        id: "0C0XlULifJtAgn6ZNCW2eu",
        name: "The Killers",
        type: "artist",
        uri: "spotify:artist:0C0XlULifJtAgn6ZNCW2eu",
        href: "https://api.spotify.com/v1/artists/0C0XlULifJtAgn6ZNCW2eu",
        external_urls: {
          spotify: "https://open.spotify.com/artist/0C0XlULifJtAgn6ZNCW2eu",
        },
      },
    ],
    release_date: "2004-06-15",
    release_date_precision: "day",
    total_tracks: 11,
    album_type: "album",
    type: "album",
    uri: "spotify:album:6TJmQnO44YE5BtTxH8pop1",
    href: "https://api.spotify.com/v1/albums/6TJmQnO44YE5BtTxH8pop1",
    images: [
      {
        url: "https://i.scdn.co/image/ab67616d0000b2736a2a5c43197ca88261fd1fa6",
        height: 640,
        width: 640,
      },
      {
        url: "https://i.scdn.co/image/ab67616d00001e026a2a5c43197ca88261fd1fa6",
        height: 300,
        width: 300,
      },
    ],
    external_urls: {
      spotify: "https://open.spotify.com/album/6TJmQnO44YE5BtTxH8pop1",
    },
    available_markets: ["US", "GB", "JP"],
    label: "Island Records",
    tracks: {
      href: "https://api.spotify.com/v1/albums/6TJmQnO44YE5BtTxH8pop1/tracks",
      items: [],
      limit: 50,
      next: null,
      offset: 0,
      previous: null,
      total: 11,
    },
  };

  it("should return album when API call succeeds", async () => {
    const mockClient = {
      albums: {
        get: vi.fn().mockResolvedValue(mockAlbum),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbum(mockClient, "6TJmQnO44YE5BtTxH8pop1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const album = result.value;
      expect(album.id).toBe("6TJmQnO44YE5BtTxH8pop1");
      expect(album.name).toBe("Hot Fuss");
      expect(album.artists).toBe("The Killers");
      expect(album.release_date).toBe("2004-06-15");
      expect(album.total_tracks).toBe(11);
      expect(album.album_type).toBe("album");
      expect(album.external_url).toBe("https://open.spotify.com/album/6TJmQnO44YE5BtTxH8pop1");
      expect(album.images).toHaveLength(2);
      expect(album.images[0].url).toBe(
        "https://i.scdn.co/image/ab67616d0000b2736a2a5c43197ca88261fd1fa6",
      );
    }

    expect(mockClient.albums.get).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1", undefined);
  });

  it("should pass market parameter when provided", async () => {
    const mockClient = {
      albums: {
        get: vi.fn().mockResolvedValue(mockAlbum),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbum(mockClient, "6TJmQnO44YE5BtTxH8pop1", "JP");

    expect(result.isOk()).toBe(true);
    expect(mockClient.albums.get).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1", "JP");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      albums: {
        get: vi.fn().mockRejectedValue(new Error("Album not found")),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbum(mockClient, "invalid-album-id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get album: Album not found");
    }
  });

  it("should validate album ID format", async () => {
    const mockClient = {
      albums: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbum(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Album ID must not be empty");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should validate market parameter format", async () => {
    const mockClient = {
      albums: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbum(mockClient, "6TJmQnO44YE5BtTxH8pop1", "INVALID");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });
});
