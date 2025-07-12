import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetAlbumTool } from "./get.ts";

describe("get-album tool", () => {
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

    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const albumData = JSON.parse((result.content[0] as any).text);
    expect(albumData.id).toBe("6TJmQnO44YE5BtTxH8pop1");
    expect(albumData.name).toBe("Hot Fuss");
    expect(albumData.artists).toBe("The Killers");
    expect(albumData.release_date).toBe("2004-06-15");
    expect(albumData.total_tracks).toBe(11);
    expect(albumData.album_type).toBe("album");
    expect(albumData.external_url).toBe("https://open.spotify.com/album/6TJmQnO44YE5BtTxH8pop1");
    expect(albumData.images).toHaveLength(2);
    expect(albumData.images[0].url).toBe(
      "https://i.scdn.co/image/ab67616d0000b2736a2a5c43197ca88261fd1fa6",
    );

    expect(mockClient.albums.get).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1", undefined);
  });

  it("should pass market parameter when provided", async () => {
    const mockClient = {
      albums: {
        get: vi.fn().mockResolvedValue(mockAlbum),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1", market: "JP" });

    expect(result.isError).toBeFalsy();
    expect(mockClient.albums.get).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1", "JP");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      albums: {
        get: vi.fn().mockRejectedValue(new Error("Album not found")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "invalid-album-id" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to get album: Album not found");
  });

  it("should validate album ID format", async () => {
    const mockClient = {
      albums: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Album ID must not be empty");
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });

  it("should validate market parameter format", async () => {
    const mockClient = {
      albums: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1", market: "INVALID" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
    expect(mockClient.albums.get).not.toHaveBeenCalled();
  });
});
