import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getAlbumTracks } from "./getAlbumTracks.ts";

describe("getAlbumTracks", () => {
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

    const result = await getAlbumTracks(mockClient, "6TJmQnO44YE5BtTxH8pop1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const tracks = result.value;
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
    }

    expect(mockClient.albums.tracks).toHaveBeenCalledWith("6TJmQnO44YE5BtTxH8pop1");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      albums: {
        tracks: vi.fn().mockRejectedValue(new Error("Album not found")),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbumTracks(mockClient, "invalid-album-id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get album tracks: Album not found");
    }
  });

  it("should validate album ID format", async () => {
    const mockClient = {
      albums: {
        tracks: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getAlbumTracks(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Album ID must not be empty");
    }
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

    const result = await getAlbumTracks(mockClient, "6TJmQnO44YE5BtTxH8pop1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
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

    const result = await getAlbumTracks(mockClient, "6TJmQnO44YE5BtTxH8pop1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value[0].preview_url).toBeNull();
    }
  });
});
