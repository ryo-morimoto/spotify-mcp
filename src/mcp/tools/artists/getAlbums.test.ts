import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";
import { createGetArtistAlbumsTool } from "@mcp/tools/artists/getAlbums.ts";

describe("get-artist-albums tool", () => {
  const mockAlbums = {
    href: "https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF/albums",
    items: [
      {
        id: "2vqf3lG9mvy9h5pBx8wXPC",
        name: "Everything All The Time",
        album_type: "album",
        total_tracks: 10,
        release_date: "2006-03-21",
        release_date_precision: "day",
        artists: [
          {
            id: "0OdUWJ0sBjDrqHygGUXeCF",
            name: "Band of Horses",
            type: "artist",
            uri: "spotify:artist:0OdUWJ0sBjDrqHygGUXeCF",
            href: "https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF",
            external_urls: {
              spotify: "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF",
            },
          },
        ],
        external_urls: {
          spotify: "https://open.spotify.com/album/2vqf3lG9mvy9h5pBx8wXPC",
        },
        images: [
          {
            url: "https://i.scdn.co/image/ab67616d00001e02",
            height: 300,
            width: 300,
          },
          {
            url: "https://i.scdn.co/image/ab67616d00004851",
            height: 64,
            width: 64,
          },
        ],
        type: "album",
        uri: "spotify:album:2vqf3lG9mvy9h5pBx8wXPC",
        href: "https://api.spotify.com/v1/albums/2vqf3lG9mvy9h5pBx8wXPC",
        available_markets: ["US", "GB", "CA"],
        album_group: "album",
      },
      {
        id: "7nRFjfAyFJnk9xffvPLZls",
        name: "Cease to Begin",
        album_type: "album",
        total_tracks: 10,
        release_date: "2007-10-09",
        release_date_precision: "day",
        artists: [
          {
            id: "0OdUWJ0sBjDrqHygGUXeCF",
            name: "Band of Horses",
            type: "artist",
            uri: "spotify:artist:0OdUWJ0sBjDrqHygGUXeCF",
            href: "https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF",
            external_urls: {
              spotify: "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF",
            },
          },
        ],
        external_urls: {
          spotify: "https://open.spotify.com/album/7nRFjfAyFJnk9xffvPLZls",
        },
        images: [
          {
            url: "https://i.scdn.co/image/ab67616d00001e03",
            height: 300,
            width: 300,
          },
        ],
        type: "album",
        uri: "spotify:album:7nRFjfAyFJnk9xffvPLZls",
        href: "https://api.spotify.com/v1/albums/7nRFjfAyFJnk9xffvPLZls",
        available_markets: ["US", "GB", "CA"],
        album_group: "album",
      },
    ],
    limit: 20,
    next: null,
    offset: 0,
    previous: null,
    total: 2,
  };

  it("should return albums when API call succeeds", async () => {
    const mockClient = {
      artists: {
        albums: vi.fn().mockResolvedValue(mockAlbums),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resourceContent = result.content[0] as EmbeddedResource;
    expect(resourceContent.resource.uri).toBe("spotify:artist:0OdUWJ0sBjDrqHygGUXeCF:albums");
    expect(resourceContent.resource.mimeType).toBe("application/json");

    const albums = JSON.parse(resourceContent.resource.text as string);
    expect(albums).toHaveLength(2);

    const firstAlbum = albums[0];
    expect(firstAlbum.id).toBe("2vqf3lG9mvy9h5pBx8wXPC");
    expect(firstAlbum.name).toBe("Everything All The Time");
    expect(firstAlbum.artists).toBe("Band of Horses");
    expect(firstAlbum.release_date).toBe("2006-03-21");
    expect(firstAlbum.total_tracks).toBe(10);
    expect(firstAlbum.album_type).toBe("album");
    expect(firstAlbum.external_url).toBe("https://open.spotify.com/album/2vqf3lG9mvy9h5pBx8wXPC");
    expect(firstAlbum.images).toHaveLength(2);
    expect(firstAlbum.images[0]).toEqual({
      url: "https://i.scdn.co/image/ab67616d00001e02",
      height: 300,
      width: 300,
    });

    expect(mockClient.artists.albums).toHaveBeenCalledWith("0OdUWJ0sBjDrqHygGUXeCF");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      artists: {
        albums: vi.fn().mockRejectedValue(new Error("Artist not found")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "invalid-artist-id" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get artist albums: Artist not found",
    );
  });

  it("should validate artist ID format", async () => {
    const mockClient = {
      artists: {
        albums: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Artist ID must not be empty");
    expect(mockClient.artists.albums).not.toHaveBeenCalled();
  });

  it("should handle empty albums list", async () => {
    const mockEmptyAlbums = {
      ...mockAlbums,
      items: [],
      total: 0,
    };

    const mockClient = {
      artists: {
        albums: vi.fn().mockResolvedValue(mockEmptyAlbums),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBeFalsy();
    const resourceContent = result.content[0] as EmbeddedResource;
    const albums = JSON.parse(resourceContent.resource.text as string);
    expect(albums).toEqual([]);
  });

  it("should handle albums with multiple artists", async () => {
    const mockAlbumsMultipleArtists = {
      ...mockAlbums,
      items: [
        {
          ...mockAlbums.items[0],
          artists: [
            {
              id: "0OdUWJ0sBjDrqHygGUXeCF",
              name: "Band of Horses",
              type: "artist",
              uri: "spotify:artist:0OdUWJ0sBjDrqHygGUXeCF",
              href: "https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF",
              external_urls: {
                spotify: "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF",
              },
            },
            {
              id: "1234567890",
              name: "Featured Artist",
              type: "artist",
              uri: "spotify:artist:1234567890",
              href: "https://api.spotify.com/v1/artists/1234567890",
              external_urls: {
                spotify: "https://open.spotify.com/artist/1234567890",
              },
            },
          ],
        },
      ],
    };

    const mockClient = {
      artists: {
        albums: vi.fn().mockResolvedValue(mockAlbumsMultipleArtists),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBeFalsy();
    const resourceContent = result.content[0] as EmbeddedResource;
    const albums = JSON.parse(resourceContent.resource.text as string);
    expect(albums[0].artists).toBe("Band of Horses, Featured Artist");
  });

  it("should handle albums with no images", async () => {
    const mockAlbumsNoImages = {
      ...mockAlbums,
      items: [
        {
          ...mockAlbums.items[0],
          images: [],
        },
      ],
    };

    const mockClient = {
      artists: {
        albums: vi.fn().mockResolvedValue(mockAlbumsNoImages),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistAlbumsTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBeFalsy();
    const resourceContent = result.content[0] as EmbeddedResource;
    const albums = JSON.parse(resourceContent.resource.text as string);
    expect(albums[0].images).toEqual([]);
  });
});
