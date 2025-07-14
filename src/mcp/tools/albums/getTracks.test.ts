import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetAlbumTracksTool } from "@mcp/tools/albums/getTracks.ts";

describe("get-album-tracks tool", () => {
  const mockTracks = {
    href: "https://api.spotify.com/v1/albums/6TJmQnO44YE5BtTxH8pop1/tracks",
    items: [
      {
        id: "3n3Ppam7vgaVa1iaRUc9Lp",
        name: "Mr. Brightside",
        disc_number: 1,
        track_number: 2,
        duration_ms: 222973,
        explicit: false,
        type: "track",
        uri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
        href: "https://api.spotify.com/v1/tracks/3n3Ppam7vgaVa1iaRUc9Lp",
        preview_url: "https://p.scdn.co/mp3-preview/32a0e6a97ede478c9ee91d0af5f8bbef9f",
        external_urls: {
          spotify: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
        },
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
      },
      {
        id: "7ojcb9kFDqHpKyOIlnWp30",
        name: "Somebody Told Me",
        disc_number: 1,
        track_number: 4,
        duration_ms: 197147,
        explicit: false,
        type: "track",
        uri: "spotify:track:7ojcb9kFDqHpKyOIlnWp30",
        href: "https://api.spotify.com/v1/tracks/7ojcb9kFDqHpKyOIlnWp30",
        preview_url: "https://p.scdn.co/mp3-preview/e95d3f3c9a87e7c6e1c4a5a18f2a58e5fb",
        external_urls: {
          spotify: "https://open.spotify.com/track/7ojcb9kFDqHpKyOIlnWp30",
        },
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
      },
    ],
    limit: 50,
    next: null,
    offset: 0,
    previous: null,
    total: 11,
  };

  it("should return tracks when API call succeeds", async () => {
    const mockClient = {
      albums: {
        tracks: vi.fn().mockResolvedValue(mockTracks),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTracksTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:album:6TJmQnO44YE5BtTxH8pop1:tracks");
    expect(resource.resource.mimeType).toBe("application/json");

    const tracks = JSON.parse(resource.resource.text);
    expect(tracks).toHaveLength(2);

    const firstTrack = tracks[0];
    expect(firstTrack.id).toBe("3n3Ppam7vgaVa1iaRUc9Lp");
    expect(firstTrack.name).toBe("Mr. Brightside");
    expect(firstTrack.artists).toBe("The Killers");
    expect(firstTrack.album).toBe("Unknown Album"); // We don't have album info in tracks endpoint
    expect(firstTrack.duration_ms).toBe(222973);
    expect(firstTrack.preview_url).toBe(
      "https://p.scdn.co/mp3-preview/32a0e6a97ede478c9ee91d0af5f8bbef9f",
    );
    expect(firstTrack.external_url).toBe("https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp");

    const secondTrack = tracks[1];
    expect(secondTrack.id).toBe("7ojcb9kFDqHpKyOIlnWp30");
    expect(secondTrack.name).toBe("Somebody Told Me");

    expect(mockClient.albums.tracks).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      albums: {
        tracks: vi.fn().mockRejectedValue(new Error("Album not found")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTracksTool(mockClient);
    const result = await tool.handler({ albumId: "invalid-album-id" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get album tracks: Album not found",
    );
  });

  it("should validate album ID format", async () => {
    const mockClient = {
      albums: {
        tracks: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTracksTool(mockClient);
    const result = await tool.handler({ albumId: "" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Album ID must not be empty");
    expect(mockClient.albums.tracks).not.toHaveBeenCalled();
  });

  it("should handle empty track list", async () => {
    const emptyResponse = {
      ...mockTracks,
      items: [],
      total: 0,
    };

    const mockClient = {
      albums: {
        tracks: vi.fn().mockResolvedValue(emptyResponse),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTracksTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1" });

    expect(result.isError).toBeFalsy();
    const resource = result.content[0] as any;
    const tracks = JSON.parse(resource.resource.text);
    expect(tracks).toHaveLength(0);
  });

  it("should handle tracks with null preview URLs", async () => {
    const tracksWithNullPreview = {
      ...mockTracks,
      items: [
        {
          ...mockTracks.items[0],
          preview_url: null,
        },
      ],
    };

    const mockClient = {
      albums: {
        tracks: vi.fn().mockResolvedValue(tracksWithNullPreview),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAlbumTracksTool(mockClient);
    const result = await tool.handler({ albumId: "6TJmQnO44YE5BtTxH8pop1" });

    expect(result.isError).toBeFalsy();
    const resource = result.content[0] as any;
    const tracks = JSON.parse(resource.resource.text);
    expect(tracks[0].preview_url).toBeNull();
  });
});
