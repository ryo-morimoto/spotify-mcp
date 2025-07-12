import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getTrack } from "./get.ts";

describe("getTrack", () => {
  const mockTrack = {
    id: "3n3Ppam7vgaVa1iaRUc9Lp",
    name: "Mr. Brightside",
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
    album: {
      id: "6TJmQnO44YE5BtTxH8pop1",
      name: "Hot Fuss",
      type: "album",
      uri: "spotify:album:6TJmQnO44YE5BtTxH8pop1",
      href: "https://api.spotify.com/v1/albums/6TJmQnO44YE5BtTxH8pop1",
      images: [],
      release_date: "2004-06-15",
      release_date_precision: "day",
      total_tracks: 11,
      artists: [],
      external_urls: {
        spotify: "https://open.spotify.com/album/6TJmQnO44YE5BtTxH8pop1",
      },
    },
    duration_ms: 222973,
    explicit: false,
    popularity: 88,
    preview_url: "https://p.scdn.co/mp3-preview/12345",
    track_number: 2,
    disc_number: 1,
    type: "track",
    uri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
    href: "https://api.spotify.com/v1/tracks/3n3Ppam7vgaVa1iaRUc9Lp",
    external_urls: {
      spotify: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
    },
    is_local: false,
    available_markets: ["US", "GB", "JP"],
  };

  it("should return track when API call succeeds", async () => {
    const mockClient = {
      tracks: {
        get: vi.fn().mockResolvedValue(mockTrack),
      },
    } as unknown as SpotifyApi;

    const result = await getTrack(mockClient, "3n3Ppam7vgaVa1iaRUc9Lp");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const track = result.value;
      expect(track.id).toBe("3n3Ppam7vgaVa1iaRUc9Lp");
      expect(track.name).toBe("Mr. Brightside");
      expect(track.artists).toBe("The Killers");
      expect(track.album).toBe("Hot Fuss");
      expect(track.duration_ms).toBe(222973);
      expect(track.preview_url).toBe("https://p.scdn.co/mp3-preview/12345");
      expect(track.external_url).toBe("https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp");
    }

    expect(mockClient.tracks.get).toHaveBeenCalledWith("3n3Ppam7vgaVa1iaRUc9Lp", undefined);
  });

  it("should pass market parameter when provided", async () => {
    const mockClient = {
      tracks: {
        get: vi.fn().mockResolvedValue(mockTrack),
      },
    } as unknown as SpotifyApi;

    const result = await getTrack(mockClient, "3n3Ppam7vgaVa1iaRUc9Lp", "JP");

    expect(result.isOk()).toBe(true);
    expect(mockClient.tracks.get).toHaveBeenCalledWith("3n3Ppam7vgaVa1iaRUc9Lp", "JP");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      tracks: {
        get: vi.fn().mockRejectedValue(new Error("Track not found")),
      },
    } as unknown as SpotifyApi;

    const result = await getTrack(mockClient, "invalid-track-id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get track: Track not found");
    }
  });

  it("should validate track ID format", async () => {
    const mockClient = {
      tracks: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getTrack(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Track ID must not be empty");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should validate market parameter format", async () => {
    const mockClient = {
      tracks: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getTrack(mockClient, "3n3Ppam7vgaVa1iaRUc9Lp", "INVALID");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });
});
