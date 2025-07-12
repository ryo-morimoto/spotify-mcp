import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetTrackTool } from "./get.ts";

describe("get_track tool", () => {
  const mockClient = {
    tracks: {
      get: vi.fn(),
    },
  } as unknown as SpotifyApi;

  beforeEach(() => {
    vi.clearAllMocks();
  });
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
  it("should get track successfully", async () => {
    vi.mocked(mockClient.tracks.get).mockResolvedValue(mockTrack as any);

    const tool = createGetTrackTool(mockClient);
    const result = await tool.handler({ trackId: "3n3Ppam7vgaVa1iaRUc9Lp" });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content.id).toBe("3n3Ppam7vgaVa1iaRUc9Lp");
    expect(content.name).toBe("Mr. Brightside");
    expect(content.artists).toBe("The Killers");
    expect(content.album).toBe("Hot Fuss");
    expect(content.duration_ms).toBe(222973);
    expect(content.preview_url).toBe("https://p.scdn.co/mp3-preview/12345");
    expect(content.external_url).toBe("https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp");

    expect(mockClient.tracks.get).toHaveBeenCalledWith("3n3Ppam7vgaVa1iaRUc9Lp", undefined);
  });

  it("should pass market parameter when provided", async () => {
    vi.mocked(mockClient.tracks.get).mockResolvedValue(mockTrack as any);

    const tool = createGetTrackTool(mockClient);
    const result = await tool.handler({ trackId: "3n3Ppam7vgaVa1iaRUc9Lp", market: "JP" });

    expect(result.isError).toBeUndefined();
    expect(mockClient.tracks.get).toHaveBeenCalledWith("3n3Ppam7vgaVa1iaRUc9Lp", "JP");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.get).mockRejectedValue(new Error("Track not found"));

    const tool = createGetTrackTool(mockClient);
    const result = await tool.handler({ trackId: "invalid-track-id" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });

  it("should validate empty track ID", async () => {
    const tool = createGetTrackTool(mockClient);
    const result = await tool.handler({ trackId: "" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });

  it("should validate invalid market code", async () => {
    const tool = createGetTrackTool(mockClient);
    const result = await tool.handler({ trackId: "3n3Ppam7vgaVa1iaRUc9Lp", market: "INVALID" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
    expect(mockClient.tracks.get).not.toHaveBeenCalled();
  });
});
